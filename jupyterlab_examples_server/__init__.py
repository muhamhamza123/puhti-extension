from .handlers import setup_handlers

# This is the modern way to register a Jupyter Server extension
def _jupyter_server_extension_points():
    return [{
        "module": "jupyterlab_examples_server"
    }]

def _load_jupyter_server_extension(server_app):
    setup_handlers(server_app.web_app)
