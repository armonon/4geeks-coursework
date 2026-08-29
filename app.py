"""Todo List CLI implementation matching the 4Geeks starter contract."""

from __future__ import annotations

import csv
from pathlib import Path


TODOS_FILE = Path("todos.csv")
todos: list[str] = []


def get_todos() -> list[str]:
    """Return the active in-memory task list used by the course tests."""
    return todos


def add_one_task(title: str) -> int:
    """Add a non-empty task and return its one-based list position."""
    cleaned_title = title.strip()
    if not cleaned_title:
        raise ValueError("A task title cannot be empty.")

    todos.append(cleaned_title)
    return len(todos)


def print_list() -> None:
    """Print every task with the numeric position used for deletion."""
    if not todos:
        print("Your todo list is empty.")
        return

    print("\nYour tasks:")
    for position, title in enumerate(todos, start=1):
        print(f"{position}. {title}")


def delete_task(number_to_delete: int | str) -> str:
    """Delete a task by its one-based position and return its title."""
    try:
        position = int(number_to_delete)
    except (TypeError, ValueError) as error:
        raise ValueError("Enter a whole number from the list.") from error

    if position < 1 or position > len(todos):
        raise IndexError("Choose a task number shown in the list.")

    return todos.pop(position - 1)


def save_todos() -> None:
    """Persist one task per row in the headerless course CSV format."""
    with TODOS_FILE.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerows([title] for title in todos)


def load_todos() -> list[str]:
    """Replace the active list with tasks loaded from ``todos.csv``."""
    todos.clear()
    if not TODOS_FILE.exists():
        return todos

    with TODOS_FILE.open(newline="", encoding="utf-8") as csv_file:
        for row in csv.reader(csv_file):
            if not row:
                continue
            title = row[0].strip()
            if title:
                todos.append(title)
    return todos


def main() -> None:
    """Run the six-action interactive menu supplied by the course starter."""
    actions = {
        "1": "Add one task",
        "2": "Delete a task",
        "3": "Print the current list of tasks",
        "4": "Save todos to todos.csv",
        "5": "Load todos from todos.csv",
        "6": "Exit",
    }

    while True:
        print("\nTodo List")
        for key, label in actions.items():
            print(f"{key}. {label}")

        response = input("Choose an option: ").strip()
        try:
            if response == "1":
                position = add_one_task(input("Task title: "))
                print(f"Task {position} added.")
            elif response == "2":
                print_list()
                if todos:
                    removed = delete_task(input("Task number to delete: "))
                    print(f"Deleted: {removed}")
            elif response == "3":
                print_list()
            elif response == "4":
                save_todos()
                print("Todos saved.")
            elif response == "5":
                load_todos()
                print(f"Loaded {len(todos)} task(s).")
            elif response == "6":
                print("Goodbye!")
                return
            else:
                print("Choose 1, 2, 3, 4, 5, or 6.")
        except (IndexError, OSError, ValueError) as error:
            print(f"Unable to complete that action: {error}")


if __name__ == "__main__":
    main()
