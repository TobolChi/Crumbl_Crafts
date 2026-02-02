#!/bin/bash
# Register runner (replace placeholders)
./config.sh --url https://github.com/<username>/<repo> --token <token> --unattended --replace

# Start runner in background
./run.sh &

# Start your API
/app/run_metrics.sh
