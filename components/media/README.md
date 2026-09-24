# Exercise media (animations) — decoupled

Drop-in renderer for exercise illustration. **To add animations later you only
touch the data, not this code:**

1. Fill `media_url` for each exercise in `syncfit-contracts` catalog
   (`python/syncfit_contracts/catalog/exercises.json`): a GIF, Lottie or short mp4.
2. The routine and shared pages render it automatically via `<ExerciseMedia />`.
3. If no `media_url`, it falls back to `image_url` (graceful degradation).

Nothing else in the frontend needs to change.
