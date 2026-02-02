#!/bin/bash
# Register runner
/actions-runner/config.sh --url https://github.com/<username>/<repo> --token <token> --unattended --replace

# Start runner in background
/actions-runner/run.sh &

# Start your API
/app/run_metrics.sh
