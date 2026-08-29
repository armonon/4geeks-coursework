import contextlib
import csv
import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import app


class TodoListTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.file_patch = patch.object(
            app, "TODOS_FILE", Path(self.temporary_directory.name) / "todos.csv"
        )
        self.file_patch.start()
        self.addCleanup(self.file_patch.stop)
        app.todos.clear()

    def test_get_todos_returns_active_list(self) -> None:
        app.add_one_task("Prepare assessment")
        self.assertIs(app.get_todos(), app.todos)
        self.assertEqual(app.get_todos(), ["Prepare assessment"])

    def test_add_one_task_trims_title_without_implicitly_saving(self) -> None:
        position = app.add_one_task("  Prepare assessment  ")
        self.assertEqual(position, 1)
        self.assertEqual(app.todos, ["Prepare assessment"])
        self.assertFalse(app.TODOS_FILE.exists())

    def test_add_rejects_empty_title(self) -> None:
        with self.assertRaisesRegex(ValueError, "cannot be empty"):
            app.add_one_task("   ")

    def test_delete_task_accepts_displayed_number(self) -> None:
        app.todos.extend(["First", "Second", "Third"])
        removed = app.delete_task("2")
        self.assertEqual(removed, "Second")
        self.assertEqual(app.todos, ["First", "Third"])

    def test_delete_rejects_numbers_outside_the_list(self) -> None:
        app.todos.append("Only task")
        for invalid_number in (0, 2):
            with self.subTest(invalid_number=invalid_number):
                with self.assertRaisesRegex(IndexError, "task number"):
                    app.delete_task(invalid_number)

    def test_print_list_shows_clear_numeric_positions(self) -> None:
        app.todos.extend(["Alpha", "Beta"])
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            app.print_list()
        self.assertIn("1. Alpha", output.getvalue())
        self.assertIn("2. Beta", output.getvalue())

    def test_save_uses_headerless_single_column_csv(self) -> None:
        app.todos.extend(["jump", "run", "roll"])
        app.save_todos()
        with app.TODOS_FILE.open(newline="", encoding="utf-8") as csv_file:
            self.assertEqual(list(csv.reader(csv_file)), [["jump"], ["run"], ["roll"]])

    def test_load_replaces_memory_from_headerless_csv(self) -> None:
        app.todos.append("Old in-memory task")
        app.TODOS_FILE.write_text("jump\nrun\nroll\n", encoding="utf-8")
        self.assertEqual(app.load_todos(), ["jump", "run", "roll"])

    def test_load_missing_file_starts_with_empty_list(self) -> None:
        app.todos.append("Old in-memory task")
        self.assertEqual(app.load_todos(), [])


if __name__ == "__main__":
    unittest.main()
