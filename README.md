# Puhti Runner — JupyterLab Extension

A JupyterLab extension that lets users submit notebooks to the **Puhti supercomputer** (CSC Finland) directly from their JupyterHub session, monitor jobs, view logs, and save results — without leaving the browser.

---

## Features

### Submit Tab
- Select any open notebook from the current session
- Choose Apptainer container (fetched live from Puhti)
- Choose Slurm partition: `small`, `large`, `gpu`, `gpumedium`, `longrun`
- Set CPUs (1–40) and RAM (1–382 GB) via sliders
- Paste extra pip packages inline (installed at runtime)
- Optional notification email — sent automatically when job finishes or fails

### Jobs Tab
- Full job history with live status (auto-refreshes every 10s)
- Per-job buttons:
  - **↓ Get** — saves results to `~/puhti-results/{slurm_id}/` on your PVC
  - **📋 Log** — shows stdout and stderr inline (live while running)
  - **↺ Resubmit** — resubmits failed/cancelled jobs with original settings
  - **✕ Cancel** — cancels a queued or running job

### Containers Tab
- List of available containers on Puhti
- **Simple request form** — describe packages, a `.def` file is generated and a GitHub PR opened automatically
- **Upload .def** — advanced users can upload their own Apptainer definition
- **My Container Requests** — tracks PR status (pending / merged / closed)

---

## Architecture

```
JupyterHub (Rahti)          Head Node                  Puhti
──────────────────          ─────────────              ──────────────
JupyterLab Extension  ───►  Nginx /puhti/  ───►  FastAPI :8002
  (this extension)          systemd service        │
                                                   ├─ SSH sbatch ──► Slurm
                                                   ├─ rsync ──────►  scratch/
                                                   └─ rsync ◄──────  output/
```

Full architecture diagram: [`docs/architecture.svg`](docs/architecture.svg)

---

## Security

- JupyterHub token validated server-side on every submission — username cannot be spoofed
- Max 3 concurrent jobs per user (configurable)
- Results saved to user PVC, not downloaded to browser
- All traffic over HTTPS

---

## Deployment

The extension is shipped as a Docker image and deployed in Rahti (CSC OpenShift).

**Current image:** `ghcr.io/muhamhamza123/puhti-extension:v20`

### Environment variables (set by JupyterHub)

| Variable | Description |
|----------|-------------|
| `JUPYTERHUB_API_TOKEN` | Token used to authenticate with JupyterHub API |
| `JUPYTERHUB_API_URL` | JupyterHub API base URL |

### Server extension endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/puhti-runner/auth-token` | Returns JupyterHub token from server env |
| POST | `/puhti-runner/save-results` | Fetches results from Puhti API and saves to PVC |

---

## Puhti Run API endpoints

All requests go to `https://hbv.we3data.com/puhti/`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/run-notebook` | Submit notebook (converted to script.py) |
| POST | `/run-code` | Submit raw Python script |
| GET | `/run-status/{job_id}` | Poll Slurm job state |
| GET | `/run-logs/{job_id}` | Get stdout + stderr |
| GET | `/run-results/{job_id}` | Download output ZIP |
| POST | `/resubmit/{job_id}` | Resubmit with original params |
| POST | `/cancel-job/{job_id}` | Cancel Slurm job |
| GET | `/my-jobs/{username}` | Job history for a user |
| GET | `/containers` | List available .sif containers |
| POST | `/request-container-simple` | Request container from package list |
| POST | `/request-container` | Request container from .def file |
| GET | `/my-container-requests/{username}` | User's container PR statuses |
| GET | `/health` | Health check |

---

## Development

The frontend is written in TypeScript (vanilla DOM, no React framework) in [`src/index.ts`](src/index.ts).

The pre-built JS bundle is at:
```
jupyterlab_examples_server/labextension/static/509.05e41c02c18fe9f656a5.js
```

Since the TypeScript build is not triggered inside Docker, changes to `src/index.ts` must also be applied to the bundle via Python string replacement before building the Docker image.

### Build and push

```bash
docker buildx build --platform linux/amd64 --no-cache \
  -t ghcr.io/muhamhamza123/puhti-extension:vXX --push .
```

### Server extension

Python handlers are in [`jupyterlab_examples_server/handlers.py`](jupyterlab_examples_server/handlers.py).

Extension registration is in [`jupyterlab_examples_server/__init__.py`](jupyterlab_examples_server/__init__.py) via `_load_jupyter_server_extension`.
