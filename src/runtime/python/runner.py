"""Deterministic test runner shared by the browser worker and the content verifier.

Entry points (both return JSON strings):
  run_tests(user_code, suites_json) -- suites_json: [{"stage": int, "source": str}, ...]
  run_file(user_code)               -- executes the code as __main__, capturing output

Every test gets a freshly executed `solution` module and test namespace, so state
never leaks between tests. Asserts of the form `assert actual <op> expected` are
rewritten to report both sides, so failures read "expected 10, got 7".
"""

import ast
import io
import json
import reprlib
import sys
import time
import traceback
import types
from contextlib import redirect_stderr, redirect_stdout

SOLUTION_FILE = "solution.py"
MAX_OUTPUT = 10_000

_repr = reprlib.Repr()
_repr.maxstring = 200
_repr.maxother = 200
_repr.maxlist = 20
_repr.maxdict = 20
_repr.maxset = 20
_repr.maxtuple = 20


def _short(value) -> str:
    return _repr.repr(value)


class CompareFailure(AssertionError):
    def __init__(self, left, op, right, msg):
        super().__init__(msg)
        self.left = left
        self.op = op
        self.right = right
        self.msg = msg


_OPS = {
    "==": lambda a, b: a == b,
    "!=": lambda a, b: a != b,
    "<": lambda a, b: a < b,
    "<=": lambda a, b: a <= b,
    ">": lambda a, b: a > b,
    ">=": lambda a, b: a >= b,
    "in": lambda a, b: a in b,
    "not in": lambda a, b: a not in b,
    "is": lambda a, b: a is b,
    "is not": lambda a, b: a is not b,
}

_AST_OPS = {
    ast.Eq: "==", ast.NotEq: "!=", ast.Lt: "<", ast.LtE: "<=", ast.Gt: ">",
    ast.GtE: ">=", ast.In: "in", ast.NotIn: "not in", ast.Is: "is", ast.IsNot: "is not",
}


def __check_compare(left, op, right, msg=None):
    if not _OPS[op](left, right):
        raise CompareFailure(left, op, right, msg)


class _AssertRewriter(ast.NodeTransformer):
    def visit_Assert(self, node):
        test = node.test
        if isinstance(test, ast.Compare) and len(test.ops) == 1 and type(test.ops[0]) in _AST_OPS:
            call = ast.Call(
                func=ast.Name(id="__check_compare", ctx=ast.Load()),
                args=[
                    test.left,
                    ast.Constant(_AST_OPS[type(test.ops[0])]),
                    test.comparators[0],
                    node.msg if node.msg is not None else ast.Constant(None),
                ],
                keywords=[],
            )
            return ast.copy_location(ast.Expr(value=call), node)
        return node


def _compile_tests(source: str, filename: str):
    tree = _AssertRewriter().visit(ast.parse(source, filename=filename))
    ast.fix_missing_locations(tree)
    return compile(tree, filename, "exec")


def _fresh_solution(code_obj) -> types.ModuleType:
    module = types.ModuleType("solution")
    module.__file__ = SOLUTION_FILE
    sys.modules["solution"] = module
    exec(code_obj, module.__dict__)
    return module


def _relevant_frames(tb, filenames):
    frames = [f for f in traceback.extract_tb(tb) if f.filename in filenames]
    return [
        {"file": f.filename, "line": f.lineno, "function": f.name, "code": (f.line or "").strip()}
        for f in frames
    ]


def _exc_message(exc: BaseException) -> str:
    text = str(exc)
    return f"{type(exc).__name__}: {text}" if text else type(exc).__name__


def _compare_message(exc: CompareFailure) -> str:
    left, op, right = _short(exc.left), exc.op, _short(exc.right)
    if op == "==":
        base = f"expected {right}, got {left}"
    elif op == "in":
        base = f"expected {left} to be in {right}"
    elif op == "not in":
        base = f"expected {left} not to be in {right}"
    else:
        base = f"expected {left} {op} {right}"
    return f"{exc.msg}: {base}" if exc.msg else base


def _syntax_error_payload(exc: SyntaxError):
    return {
        "message": f"SyntaxError: {exc.msg}",
        "line": exc.lineno,
        "column": exc.offset,
        "code": (exc.text or "").rstrip("\n"),
    }


class _Capped(io.StringIO):
    def write(self, s):
        remaining = MAX_OUTPUT - self.tell()
        if remaining > 0:
            super().write(s[:remaining])
        return len(s)


def _first_doc_line(fn) -> str:
    doc = (fn.__doc__ or "").strip()
    return doc.splitlines()[0] if doc else ""


def run_tests(user_code: str, suites_json: str) -> str:
    suites = json.loads(suites_json)
    try:
        solution_code = compile(user_code, SOLUTION_FILE, "exec")
    except SyntaxError as exc:
        return json.dumps({"loadError": _syntax_error_payload(exc), "results": []})

    results = []
    for suite in suites:
        stage = suite["stage"]
        filename = f"stage{stage}_tests.py"
        test_code = _compile_tests(suite["source"], filename)
        source_lines = suite["source"].splitlines()

        # Discover test names once, in definition order, from a dry namespace.
        try:
            _fresh_solution(solution_code)
        except BaseException as exc:  # noqa: BLE001 - surface any import-time failure
            return json.dumps({
                "loadError": {
                    "message": _exc_message(exc),
                    "frames": _relevant_frames(exc.__traceback__, {SOLUTION_FILE}),
                },
                "results": [],
            })
        discovery = {"__check_compare": __check_compare, "__name__": f"stage{stage}_tests"}
        exec(test_code, discovery)
        names = [n for n, v in discovery.items() if n.startswith("test_") and callable(v)]

        for name in names:
            results.append(_run_one(stage, name, solution_code, test_code, filename, source_lines))

    return json.dumps({"loadError": None, "results": results})


def _run_one(stage, name, solution_code, test_code, filename, source_lines):
    out = _Capped()
    result = {"stage": stage, "name": name, "doc": "", "status": "pass", "message": "",
              "line": None, "code": "", "frames": [], "stdout": "", "ms": 0.0}
    start = time.perf_counter()
    try:
        with redirect_stdout(out), redirect_stderr(out):
            _fresh_solution(solution_code)
            namespace = {"__check_compare": __check_compare, "__name__": f"stage{stage}_tests"}
            exec(test_code, namespace)
            fn = namespace[name]
            result["doc"] = _first_doc_line(fn)
            fn()
    except CompareFailure as exc:
        result["status"] = "fail"
        result["message"] = _compare_message(exc)
        _locate(result, exc, filename, source_lines)
    except AssertionError as exc:
        result["status"] = "fail"
        _locate(result, exc, filename, source_lines)
        result["message"] = str(exc) or f"assertion failed: {result['code']}"
    except NotImplementedError as exc:
        result["status"] = "fail"
        result["message"] = "Not implemented yet (raised NotImplementedError)"
        _locate(result, exc, filename, source_lines)
        result["frames"] = _relevant_frames(exc.__traceback__, {SOLUTION_FILE, filename})
    except RecursionError as exc:
        result["status"] = "error"
        result["message"] = "RecursionError: maximum recursion depth exceeded"
        _locate(result, exc, filename, source_lines)
    except BaseException as exc:  # noqa: BLE001 - report any failure as a test error
        result["status"] = "error"
        result["message"] = _exc_message(exc)
        _locate(result, exc, filename, source_lines)
        result["frames"] = _relevant_frames(exc.__traceback__, {SOLUTION_FILE, filename})
    result["ms"] = round((time.perf_counter() - start) * 1000, 2)
    result["stdout"] = out.getvalue()
    return result


def _locate(result, exc, filename, source_lines):
    """Point at the line in the test file that failed."""
    for frame in reversed(traceback.extract_tb(exc.__traceback__)):
        if frame.filename == filename:
            result["line"] = frame.lineno
            if frame.lineno and 0 < frame.lineno <= len(source_lines):
                result["code"] = source_lines[frame.lineno - 1].strip()
            return


def run_file(user_code: str) -> str:
    out = _Capped()
    error = None
    start = time.perf_counter()
    try:
        code = compile(user_code, SOLUTION_FILE, "exec")
    except SyntaxError as exc:
        return json.dumps({"stdout": "", "error": _syntax_error_payload(exc), "ms": 0.0})
    try:
        with redirect_stdout(out), redirect_stderr(out):
            module = types.ModuleType("__main__")
            module.__file__ = SOLUTION_FILE
            exec(code, module.__dict__)
    except SystemExit:
        pass
    except BaseException as exc:  # noqa: BLE001 - report any failure to the user
        error = {
            "message": _exc_message(exc),
            "frames": _relevant_frames(exc.__traceback__, {SOLUTION_FILE}),
        }
    ms = round((time.perf_counter() - start) * 1000, 2)
    return json.dumps({"stdout": out.getvalue(), "error": error, "ms": ms})
