"""Compatibility imports for code that previously used ``src.app``."""

from app import (
    TODOS_FILE,
    add_one_task,
    delete_task,
    get_todos,
    load_todos,
    main,
    print_list,
    save_todos,
    todos,
)

__all__ = [
    "TODOS_FILE",
    "add_one_task",
    "delete_task",
    "get_todos",
    "load_todos",
    "main",
    "print_list",
    "save_todos",
    "todos",
]
