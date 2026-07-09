FROM ghcr.io/muhamhamza123/diwa-base-image:v1

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g yarn \
    && rm -rf /var/lib/apt/lists/*

USER ${NB_UID}

WORKDIR /home/jovyan/puhti-extension

COPY --chown=${NB_UID}:${NB_GID} . .

RUN pip install --no-cache-dir hatchling hatch-jupyter-builder hatch-nodejs-version \
    && yarn install \
    && pip install --no-cache-dir . \
    && jupyter server extension enable jupyterlab_examples_server

WORKDIR /home/jovyan

EXPOSE 8888
CMD ["jupyter", "lab", "--ip=0.0.0.0", "--port=8888", "--no-browser", "--NotebookApp.token=''", "--NotebookApp.password=''"]
