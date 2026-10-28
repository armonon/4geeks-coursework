# StreamLoop — ajuste del modelo de abandono

Este proyecto completa el ejercicio de optimización de hiperparámetros con el
conjunto de datos oficial de clientes. Mantiene un test final separado, incluye
todo el preprocesamiento aprendido dentro de un `Pipeline`, registra una línea
base con los parámetros predeterminados y ejecuta primero `RandomizedSearchCV`
y después `GridSearchCV`.

```bash
uv sync
uv run python scripts/train.py
uv run pytest -q
```

La métrica principal es F2: da más peso al recall porque no detectar a un
cliente que abandona cuesta más que enviar una oferta innecesaria, pero también
penaliza un clasificador degenerado que predice abandono para todos.
