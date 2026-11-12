import unittest

from taskgraph import (
    CycleError,
    DuplicateTaskError,
    TaskGraph,
    TaskGraphError,
    UnknownDependencyError,
    UnknownKindError,
)


class TaskGraphTests(unittest.TestCase):
    def test_names_keep_definition_order(self):
        graph = TaskGraph()
        for name in ("zeta", "alpha", "mid"):
            graph.add(name, "build")
        self.assertEqual(graph.names(), ["zeta", "alpha", "mid"])
        self.assertEqual(len(graph), 3)

    def test_name_and_kind_are_normalized(self):
        graph = TaskGraph()
        graph.add("  compile ", " BUILD ")
        self.assertEqual(graph.names(), ["compile"])
        self.assertEqual(graph.summary().splitlines()[0], "build: 1 (compile)")

    def test_duplicate_task(self):
        graph = TaskGraph()
        graph.add("compile", "build")
        with self.assertRaises(DuplicateTaskError) as caught:
            graph.add(" compile", "test")
        self.assertEqual(caught.exception.name, "compile")
        self.assertIsInstance(caught.exception, TaskGraphError)

    def test_unknown_kind(self):
        for kind in ("lint", "", "builds"):
            with self.subTest(kind=kind):
                graph = TaskGraph()
                with self.assertRaises(UnknownKindError) as caught:
                    graph.add("x", kind)
                self.assertEqual(caught.exception.kind, kind)
                self.assertEqual(len(graph), 0)

    def test_unknown_dependency_reports_first_in_definition_order(self):
        graph = TaskGraph()
        graph.add("b", "test", depends_on=["missing-b"])
        graph.add("a", "build", depends_on=["missing-a"])
        with self.assertRaises(UnknownDependencyError) as caught:
            graph.execution_order()
        self.assertEqual((caught.exception.name, caught.exception.dependency), ("b", "missing-b"))

    def test_order_respects_dependencies(self):
        graph = TaskGraph()
        graph.add("deploy", "deploy", depends_on=["test"])
        graph.add("test", "test", depends_on=["compile"])
        graph.add("compile", "build")
        self.assertEqual(graph.execution_order(), ["compile", "test", "deploy"])

    def test_order_uses_priority_then_definition_order(self):
        graph = TaskGraph()
        graph.add("docs", "build")
        graph.add("lint", "test", priority=2)
        graph.add("compile", "build", priority=1)
        graph.add("format", "test", priority=2)
        graph.add("assets", "build")
        self.assertEqual(
            graph.execution_order(), ["compile", "lint", "format", "docs", "assets"]
        )

    def test_priority_zero_and_negative(self):
        graph = TaskGraph()
        graph.add("none", "build")
        graph.add("zero", "build", priority=0)
        graph.add("negative", "build", priority=-5)
        self.assertEqual(graph.execution_order(), ["negative", "zero", "none"])

    def test_cycle_is_reported_as_a_closed_path(self):
        graph = TaskGraph()
        graph.add("setup", "build")
        graph.add("a", "build", depends_on=["setup", "c"])
        graph.add("b", "test", depends_on=["a"])
        graph.add("c", "deploy", depends_on=["b"])
        with self.assertRaises(CycleError) as caught:
            graph.execution_order()
        self.assertEqual(caught.exception.cycle, ["a", "c", "b", "a"])
        self.assertEqual(str(caught.exception), "cycle: a -> c -> b -> a")

    def test_self_dependency_is_a_cycle(self):
        graph = TaskGraph()
        graph.add("loop", "build", depends_on=["loop"])
        with self.assertRaises(CycleError) as caught:
            graph.execution_order()
        self.assertEqual(caught.exception.cycle, ["loop", "loop"])

    def test_summary_lists_every_kind_in_fixed_order(self):
        graph = TaskGraph()
        graph.add("unit", "test")
        graph.add("compile", "build")
        graph.add("integration", "test")
        self.assertEqual(
            graph.summary(),
            "build: 1 (compile)\ntest: 2 (unit, integration)\ndeploy: 0 (-)",
        )

    def test_empty_graph(self):
        graph = TaskGraph()
        self.assertEqual(graph.execution_order(), [])
        self.assertEqual(graph.summary(), "build: 0 (-)\ntest: 0 (-)\ndeploy: 0 (-)")


if __name__ == "__main__":
    unittest.main()
