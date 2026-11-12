"""A small task graph: tasks with dependencies, ordered for execution."""

KINDS = ("build", "test", "deploy")


class TaskGraphError(Exception):
    """Base class for every error this module raises."""


class DuplicateTaskError(TaskGraphError):
    def __init__(self, name):
        super().__init__(f"task {name!r} is already defined")
        self.name = name


class UnknownKindError(TaskGraphError):
    def __init__(self, name, kind):
        super().__init__(f"task {name!r} has unknown kind {kind!r}")
        self.name = name
        self.kind = kind


class UnknownDependencyError(TaskGraphError):
    def __init__(self, name, dependency):
        super().__init__(f"task {name!r} depends on undefined task {dependency!r}")
        self.name = name
        self.dependency = dependency


class CycleError(TaskGraphError):
    def __init__(self, cycle):
        super().__init__("cycle: " + " -> ".join(cycle))
        self.cycle = cycle


class TaskGraph:
    def __init__(self):
        self._tasks = {}

    def add(self, name, kind, depends_on=(), priority=None):
        """Define a task. A task with no priority sorts after every task that has one."""
        name = name.strip()
        kind = kind.strip().lower()
        if name in self._tasks:
            raise DuplicateTaskError(name)
        if kind not in KINDS:
            raise UnknownKindError(name, kind)
        self._tasks[name] = {
            "kind": kind,
            "depends_on": [d.strip() for d in depends_on],
            "priority": priority,
        }

    def __len__(self):
        return len(self._tasks)

    def names(self):
        """Task names in definition order."""
        return list(self._tasks)

    def validate(self):
        """Raise for the first undefined dependency, in definition order."""
        for name, task in self._tasks.items():
            for dependency in task["depends_on"]:
                if dependency not in self._tasks:
                    raise UnknownDependencyError(name, dependency)

    def execution_order(self):
        """Return names so that every task comes after its dependencies.

        Among the tasks that are ready, the lowest priority number goes first. Tasks
        without a priority go after those with one. Ties keep definition order.
        """
        self.validate()
        position = {name: index for index, name in enumerate(self._tasks)}
        remaining = {name: set(task["depends_on"]) for name, task in self._tasks.items()}
        order = []
        while remaining:
            ready = [name for name, deps in remaining.items() if not deps]
            if not ready:
                raise CycleError(self._find_cycle(remaining))
            ready.sort(key=lambda name: self._sort_key(name, position))
            chosen = ready[0]
            order.append(chosen)
            del remaining[chosen]
            for deps in remaining.values():
                deps.discard(chosen)
        return order

    def _sort_key(self, name, position):
        priority = self._tasks[name]["priority"]
        return (priority is None, priority if priority is not None else 0, position[name])

    def _find_cycle(self, remaining):
        # Start from the first unfinished task in definition order and follow the
        # first unfinished dependency until a task repeats.
        start = next(iter(remaining))
        path = [start]
        while True:
            current = path[-1]
            following = next(d for d in self._tasks[current]["depends_on"] if d in remaining)
            if following in path:
                return path[path.index(following):] + [following]
            path.append(following)

    def summary(self):
        """One line per kind, in the order of KINDS, including kinds with no tasks."""
        lines = []
        for kind in KINDS:
            names = [name for name, task in self._tasks.items() if task["kind"] == kind]
            listing = ", ".join(names) if names else "-"
            lines.append(f"{kind}: {len(names)} ({listing})")
        return "\n".join(lines)
