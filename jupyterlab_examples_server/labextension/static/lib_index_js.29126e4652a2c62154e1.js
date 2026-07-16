"use strict";
(self["webpackChunk_jupyterlab_examples_server_extension"] = self["webpackChunk_jupyterlab_examples_server_extension"] || []).push([["lib_index_js"],{

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @lumino/widgets */ "webpack/sharing/consume/default/@lumino/widgets");
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_lumino_widgets__WEBPACK_IMPORTED_MODULE_2__);



const API = 'https://hbv.we3data.com/puhti';
// ── helpers ──────────────────────────────────────────────────────────────────
function el(tag, css, text) {
    const e = document.createElement(tag);
    e.style.cssText = css;
    if (text !== undefined) {
        e.textContent = text;
    }
    return e;
}
function btn(label, color, onClick) {
    const b = el('button', `padding:5px 12px;border-radius:6px;border:none;background:${color};color:white;` +
        'cursor:pointer;font-size:12px;font-family:inherit;font-weight:500;');
    b.textContent = label;
    b.onclick = onClick;
    return b;
}
// ── Main widget ──────────────────────────────────────────────────────────────
class PuhtiWidget extends _lumino_widgets__WEBPACK_IMPORTED_MODULE_2__.Widget {
    constructor(tracker) {
        super();
        this._jhToken = '';
        this._allJobs = [];
        this._jobPage = 0;
        this._PAGE_SIZE = 10;
        this._defBytes = null;
        this._defFname = '';
        this._tracker = tracker;
        const m = window.location.pathname.match(/\/user\/([^\/]+)/);
        this._username = m ? m[1] : '';
        this.id = 'puhti-panel';
        this.title.label = 'Puhti';
        this.title.caption = 'Run notebooks on Puhti';
        this.title.closable = true;
        this.node.style.cssText =
            'display:flex;flex-direction:column;height:100%;' +
                'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;' +
                'background:var(--jp-layout-color1);color:var(--jp-ui-font-color1);overflow:hidden;';
        this._loadAuthToken().then(() => this._build());
    }
    async _loadAuthToken() {
        try {
            const base = window.location.pathname.replace(/\/lab(\/.*)?$/, '/');
            const r = await fetch(base + 'puhti-runner/auth-token');
            if (r.ok) {
                const d = await r.json();
                this._jhToken = d.token || '';
            }
        }
        catch ( /* no token, proceed unauthenticated */_a) { /* no token, proceed unauthenticated */ }
    }
    async _api(method, path, body) {
        const headers = {};
        if (this._jhToken) {
            headers['X-JupyterHub-Token'] = this._jhToken;
        }
        const opts = { method, headers };
        if (body instanceof FormData) {
            opts.body = body;
        }
        else if (body) {
            opts.body = body;
            headers['Content-Type'] = 'application/json';
        }
        const r = await fetch(`${API}${path}`, opts);
        if (!r.ok) {
            throw new Error(await r.text());
        }
        return r.json();
    }
    _build() {
        // Header
        const hdr = el('div', 'background:var(--jp-layout-color2);border-bottom:1px solid var(--jp-border-color2);' +
            'padding:10px 12px;flex-shrink:0;');
        hdr.appendChild(el('span', 'font-size:13px;font-weight:700;', '⚡ Puhti Runner'));
        this.node.appendChild(hdr);
        // Tab bar
        const tabBar = el('div', 'display:flex;border-bottom:1px solid var(--jp-border-color2);flex-shrink:0;');
        const tabs = ['Submit', 'Jobs', 'Containers'];
        const panels = [];
        tabs.forEach((name, i) => {
            const t = el('button', 'flex:1;padding:8px 4px;border:none;background:none;cursor:pointer;font-size:12px;' +
                'font-family:inherit;border-bottom:2px solid transparent;color:var(--jp-ui-font-color2);', name);
            const p = el('div', 'flex:1;overflow-y:auto;padding:12px;display:none;flex-direction:column;gap:10px;');
            panels.push(p);
            t.onclick = () => {
                panels.forEach((pp, j) => {
                    pp.style.display = 'none';
                    tabBar.children[j].style.borderBottomColor = 'transparent';
                    tabBar.children[j].style.color = 'var(--jp-ui-font-color2)';
                });
                p.style.display = 'flex';
                t.style.borderBottomColor = 'var(--jp-brand-color1)';
                t.style.color = 'var(--jp-ui-font-color1)';
                if (i === 0) {
                    this._refreshNotebooks();
                }
                if (i === 1) {
                    this._loadHistory();
                }
                if (i === 2) {
                    this._refreshContainers();
                    this._loadContainerRequests();
                }
            };
            tabBar.appendChild(t);
            this.node.appendChild(p);
        });
        this.node.insertBefore(tabBar, panels[0]);
        this._buildSubmit(panels[0]);
        this._buildJobs(panels[1]);
        this._buildContainers(panels[2]);
        tabBar.children[0].click();
        // auto-refresh every 10s
        setInterval(() => {
            if (panels[1].style.display !== 'none') {
                this._loadHistory();
            }
            if (panels[2].style.display !== 'none') {
                this._loadContainerRequests();
            }
        }, 10000);
    }
    // ── Submit tab ──────────────────────────────────────────────────────────────
    _buildSubmit(p) {
        p.appendChild(this._label('Notebook'));
        this._nbSelect = el('select', this._inputCss());
        p.appendChild(this._nbSelect);
        const refreshNbBtn = btn('↻ Refresh', '#64748b', () => this._refreshNotebooks());
        refreshNbBtn.style.marginTop = '-4px';
        p.appendChild(refreshNbBtn);
        p.appendChild(this._label('Container'));
        this._containerSelect = el('select', this._inputCss());
        p.appendChild(this._containerSelect);
        p.appendChild(this._label('Partition'));
        this._partitionSelect = el('select', this._inputCss());
        ['small', 'large', 'gpu', 'gpumedium', 'longrun'].forEach(v => {
            const o = document.createElement('option');
            o.value = o.textContent = v;
            this._partitionSelect.appendChild(o);
        });
        p.appendChild(this._partitionSelect);
        const cpuRow = el('div', 'display:flex;align-items:center;gap:8px;');
        p.appendChild(this._label('CPUs'));
        this._cpuRange = el('input', 'flex:1;');
        this._cpuRange.type = 'range';
        this._cpuRange.min = '1';
        this._cpuRange.max = '40';
        this._cpuRange.value = '4';
        this._cpuLabel = el('span', 'font-size:12px;width:24px;text-align:right;', '4');
        this._cpuRange.oninput = () => { this._cpuLabel.textContent = this._cpuRange.value; };
        cpuRow.appendChild(this._cpuRange);
        cpuRow.appendChild(this._cpuLabel);
        p.appendChild(cpuRow);
        const memRow = el('div', 'display:flex;align-items:center;gap:8px;');
        p.appendChild(this._label('RAM (GB)'));
        this._memRange = el('input', 'flex:1;');
        this._memRange.type = 'range';
        this._memRange.min = '1';
        this._memRange.max = '382';
        this._memRange.value = '16';
        this._memLabel = el('span', 'font-size:12px;width:32px;text-align:right;', '16 GB');
        this._memRange.oninput = () => { this._memLabel.textContent = `${this._memRange.value} GB`; };
        memRow.appendChild(this._memRange);
        memRow.appendChild(this._memLabel);
        p.appendChild(memRow);
        p.appendChild(this._label('Extra packages (requirements.txt)'));
        this._reqText = el('textarea', this._inputCss() + 'height:70px;resize:vertical;font-family:monospace;font-size:11px;');
        this._reqText.placeholder = 'numpy\npandas\n...';
        p.appendChild(this._reqText);
        p.appendChild(this._label('Notification email (optional)'));
        this._emailInput = el('input', this._inputCss());
        this._emailInput.type = 'email';
        this._emailInput.placeholder = 'you@example.com — notified when job finishes';
        p.appendChild(this._emailInput);
        this._submitStatus = el('div', 'font-size:12px;min-height:18px;');
        const submitBtn = btn('▶  Run on Puhti', '#10b981', () => {
            if (submitBtn.dataset.busy === '1') {
                return;
            }
            submitBtn.dataset.busy = '1';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting…';
            submitBtn.style.opacity = '0.6';
            this._submit().finally(() => {
                delete submitBtn.dataset.busy;
                submitBtn.disabled = false;
                submitBtn.textContent = '▶  Run on Puhti';
                submitBtn.style.opacity = '1';
            });
        });
        p.appendChild(submitBtn);
        p.appendChild(this._submitStatus);
        this._refreshNotebooks();
        this._loadContainers();
    }
    async _refreshNotebooks() {
        const nb = this._tracker.currentWidget;
        const notebooks = [];
        this._tracker.forEach(w => {
            const path = w.context.path;
            if (path.endsWith('.ipynb') && !path.toLowerCase().includes('launcher')) {
                notebooks.push(path);
            }
        });
        this._nbSelect.innerHTML = '';
        if (notebooks.length === 0) {
            const o = document.createElement('option');
            o.textContent = '(no open notebooks)';
            this._nbSelect.appendChild(o);
        }
        else {
            notebooks.forEach(p => {
                const o = document.createElement('option');
                o.value = p;
                o.textContent = p.split('/').pop() || p;
                this._nbSelect.appendChild(o);
            });
            if (nb) {
                this._nbSelect.value = nb.context.path;
            }
        }
    }
    async _loadContainers() {
        try {
            const data = await this._api('GET', '/containers');
            this._containerSelect.innerHTML = '';
            data.containers.forEach(c => {
                const o = document.createElement('option');
                o.value = o.textContent = c;
                this._containerSelect.appendChild(o);
            });
        }
        catch (_a) {
            const o = document.createElement('option');
            o.value = 'general-compute';
            o.textContent = 'general-compute';
            this._containerSelect.appendChild(o);
        }
    }
    async _submit() {
        const path = this._nbSelect.value;
        if (!path || path.startsWith('(')) {
            this._setStatus(this._submitStatus, 'No notebook selected', 'red');
            return;
        }
        this._setStatus(this._submitStatus, 'Reading notebook…', '#f59e0b');
        let nbContent;
        try {
            let widget = null;
            this._tracker.forEach((w) => { if (w.context.path === path) {
                widget = w;
            } });
            if (!widget) {
                throw new Error('Notebook not found — is it open?');
            }
            nbContent = JSON.stringify(widget.context.model.toJSON());
        }
        catch (e) {
            this._setStatus(this._submitStatus, `Could not read notebook: ${e}`, 'red');
            return;
        }
        this._setStatus(this._submitStatus, 'Submitting…', '#f59e0b');
        const fd = new FormData();
        fd.append('notebook', new Blob([nbContent], { type: 'application/json' }), path.split('/').pop() || 'notebook.ipynb');
        fd.append('partition', this._partitionSelect.value);
        fd.append('cpus', this._cpuRange.value);
        fd.append('memory_gb', this._memRange.value);
        fd.append('container', this._containerSelect.value);
        fd.append('username', this._username);
        const emailVal = this._emailInput.value.trim();
        if (emailVal) {
            fd.append('email', emailVal);
        }
        const reqs = this._reqText.value.trim();
        if (reqs) {
            fd.append('requirements', new Blob([reqs], { type: 'text/plain' }), 'requirements.txt');
        }
        try {
            const job = await this._api('POST', '/run-notebook', fd);
            this._setStatus(this._submitStatus, `Submitted — Slurm ${job.slurm_id} — check Jobs tab`, '#3b82f6');
        }
        catch (e) {
            this._setStatus(this._submitStatus, `Submit failed: ${e}`, 'red');
        }
    }
    // ── Jobs tab ────────────────────────────────────────────────────────────────
    _buildJobs(p) {
        const topRow = el('div', 'display:flex;gap:8px;flex-shrink:0;align-items:center;');
        topRow.appendChild(btn('↻ Refresh', '#3b82f6', () => this._loadHistory()));
        p.appendChild(topRow);
        // log panel at top so it's always visible
        this._logPanel = el('div', 'display:none;background:var(--jp-layout-color0);border:1px solid var(--jp-border-color2);' +
            'border-radius:6px;padding:8px;font-size:11px;font-family:monospace;overflow-x:auto;max-height:200px;overflow-y:auto;flex-shrink:0;');
        p.appendChild(this._logPanel);
        // pagination controls
        const pageRow = el('div', 'display:flex;gap:6px;align-items:center;flex-shrink:0;');
        const prevBtn = btn('◀', '#64748b', () => { if (this._jobPage > 0) {
            this._jobPage--;
            this._renderPage();
        } });
        const nextBtn = btn('▶', '#64748b', () => {
            if ((this._jobPage + 1) * this._PAGE_SIZE < this._allJobs.length) {
                this._jobPage++;
                this._renderPage();
            }
        });
        this._pageLabel = el('span', 'font-size:11px;color:var(--jp-ui-font-color2);flex:1;text-align:center;');
        pageRow.appendChild(prevBtn);
        pageRow.appendChild(this._pageLabel);
        pageRow.appendChild(nextBtn);
        p.appendChild(pageRow);
        this._jobsList = el('div', 'display:flex;flex-direction:column;gap:8px;');
        p.appendChild(this._jobsList);
    }
    async _loadHistory() {
        if (!this._username) {
            this._jobsList.innerHTML = '<div style="font-size:12px;color:var(--jp-ui-font-color2);">No username found.</div>';
            return;
        }
        try {
            const data = await this._api('GET', `/my-jobs-status/${this._username}`);
            this._allJobs = data.jobs;
            this._jobPage = 0;
            this._renderPage();
        }
        catch (e) {
            this._jobsList.innerHTML = `<div style="color:red;font-size:12px;">Error: ${e}</div>`;
        }
    }
    _renderPage() {
        this._jobsList.innerHTML = '';
        if (!this._allJobs.length) {
            this._jobsList.innerHTML = '<div style="font-size:12px;color:var(--jp-ui-font-color2);">No jobs yet.</div>';
            this._pageLabel.textContent = '';
            return;
        }
        const total = this._allJobs.length;
        const start = this._jobPage * this._PAGE_SIZE;
        const end = Math.min(start + this._PAGE_SIZE, total);
        this._pageLabel.textContent = `${start + 1}–${end} of ${total}`;
        this._allJobs.slice(start, end).forEach(job => this._jobsList.appendChild(this._makeJobRow(job)));
    }
    _makeJobRow(job) {
        const STATUS_COLOR = {
            queued: '#f59e0b', running: '#3b82f6', done: '#10b981',
            failed: '#ef4444', cancelled: '#64748b'
        };
        const row = el('div', 'background:var(--jp-layout-color2);border-radius:6px;padding:8px 10px;' +
            'display:flex;flex-direction:column;gap:6px;');
        const top = el('div', 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;');
        top.appendChild(el('span', `color:${STATUS_COLOR[job.status] || '#64748b'};font-size:14px;`, '●'));
        const created = job.created ? new Date(job.created.replace(' ', 'T') + 'Z').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        top.appendChild(el('span', 'flex:1;font-size:11px;color:var(--jp-ui-font-color1);', `${job.job_id.slice(0, 8)} · Slurm ${job.slurm_id} · ${job.status} · ${job.partition}${created ? ' · ' + created : ''}`));
        if (job.status === 'done') {
            const getBtn = btn('↓ Get', '#10b981', () => {
                if (getBtn.disabled) {
                    return;
                }
                getBtn.disabled = true;
                getBtn.textContent = 'Saving…';
                getBtn.style.opacity = '0.6';
                setTimeout(async () => {
                    await this._fetchResultsFor(job.job_id, job.slurm_id, row);
                    getBtn.disabled = false;
                    getBtn.textContent = '↓ Get';
                    getBtn.style.opacity = '1';
                }, 0);
            });
            top.appendChild(getBtn);
        }
        top.appendChild(btn('📋 Log', '#64748b', () => this._showLogFor(job.job_id)));
        if (job.status === 'failed' || job.status === 'cancelled') {
            top.appendChild(btn('↺ Resubmit', '#f59e0b', () => this._resubmit(job.job_id, row)));
        }
        if (job.status === 'queued' || job.status === 'running') {
            top.appendChild(btn('✕ Cancel', '#ef4444', () => this._cancelJob(job.job_id, row)));
        }
        row.appendChild(top);
        return row;
    }
    async _fetchResultsFor(jobId, slurmId, row) {
        try {
            const xsrf = (document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('_xsrf=')) || '').split('=')[1] || '';
            const base = window.location.pathname.replace(/\/lab(\/.*)?$/, '/');
            const r = await fetch(base + 'puhti-runner/save-results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-XSRFToken': decodeURIComponent(xsrf) },
                body: JSON.stringify({ job_id: jobId, slurm_id: slurmId })
            });
            if (!r.ok) {
                throw new Error(await r.text());
            }
            const data = await r.json();
            const msg = el('div', 'font-size:11px;color:#10b981;', `✓ Saved to ${data.saved_to}`);
            row.appendChild(msg);
        }
        catch (e) {
            const msg = el('div', 'font-size:11px;color:#ef4444;', `✗ ${e}`);
            row.appendChild(msg);
        }
    }
    async _showLogFor(jobId) {
        this._logPanel.style.display = 'block';
        this._logPanel.innerHTML = '<span style="color:var(--jp-ui-font-color2);">Loading log…</span>';
        try {
            const data = await this._api('GET', `/run-logs/${jobId}`);
            const stdout = data.stdout || '(empty)';
            const stderr = data.stderr || '(empty)';
            this._logPanel.innerHTML =
                `<div style="font-weight:700;margin-bottom:4px;">stdout</div>` +
                    `<pre style="white-space:pre-wrap;margin:0 0 10px 0;">${this._esc(stdout)}</pre>` +
                    `<div style="font-weight:700;margin-bottom:4px;">stderr</div>` +
                    `<pre style="white-space:pre-wrap;margin:0;">${this._esc(stderr)}</pre>`;
        }
        catch (e) {
            this._logPanel.innerHTML = `<span style="color:#ef4444;">Could not fetch log: ${e}</span>`;
        }
    }
    async _resubmit(jobId, row) {
        const msgEl = el('div', 'font-size:11px;color:#f59e0b;', 'Resubmitting…');
        row.appendChild(msgEl);
        try {
            const result = await this._api('POST', `/resubmit/${jobId}`);
            msgEl.style.color = '#10b981';
            msgEl.textContent = `✓ New job ${result.job_id.slice(0, 8)} · Slurm ${result.slurm_id}`;
            setTimeout(() => this._loadHistory(), 500);
        }
        catch (e) {
            msgEl.style.color = '#ef4444';
            msgEl.textContent = `✗ Resubmit failed: ${e}`;
        }
    }
    async _cancelJob(jobId, row) {
        if (!confirm('Cancel this job? This cannot be undone.')) {
            return;
        }
        try {
            await this._api('POST', `/cancel-job/${jobId}`);
            setTimeout(() => this._loadHistory(), 500);
        }
        catch (e) {
            const msg = el('div', 'font-size:11px;color:#ef4444;', `✗ Cancel failed: ${e}`);
            row.appendChild(msg);
        }
    }
    // ── Containers tab ──────────────────────────────────────────────────────────
    _buildContainers(p) {
        p.appendChild(btn('↻ Refresh list', '#64748b', () => this._refreshContainers()));
        this._containersList = el('div', 'display:flex;flex-direction:column;gap:4px;');
        p.appendChild(this._containersList);
        p.appendChild(el('hr', 'border:none;border-top:1px solid var(--jp-border-color2);margin:4px 0;'));
        p.appendChild(this._label('Request new container'));
        // Simple form
        p.appendChild(this._label('Container name (lowercase, hyphens only)'));
        this._simpleNameInput = el('input', this._inputCss());
        this._simpleNameInput.placeholder = 'e.g. my-hydrology';
        p.appendChild(this._simpleNameInput);
        p.appendChild(this._label('Packages (one per line)'));
        this._simplePackagesInput = el('textarea', this._inputCss() + 'height:80px;resize:vertical;font-family:monospace;font-size:11px;');
        this._simplePackagesInput.placeholder = 'torch\ntransformers\ngeopandas';
        p.appendChild(this._simplePackagesInput);
        p.appendChild(this._label('Description (optional)'));
        this._simpleDescInput = el('input', this._inputCss());
        this._simpleDescInput.placeholder = 'e.g. ML container with PyTorch';
        p.appendChild(this._simpleDescInput);
        this._simpleStatus = el('div', 'font-size:12px;min-height:18px;');
        p.appendChild(btn('Request Container', '#f59e0b', () => this._requestSimpleContainer()));
        p.appendChild(this._simpleStatus);
        p.appendChild(el('hr', 'border:none;border-top:1px solid var(--jp-border-color2);margin:4px 0;'));
        p.appendChild(this._label('Upload .def file'));
        this._defInput = el('input', 'display:none;');
        this._defInput.type = 'file';
        this._defInput.accept = '.def';
        this._defInput.onchange = () => {
            var _a;
            const f = (_a = this._defInput.files) === null || _a === void 0 ? void 0 : _a[0];
            if (!f) {
                return;
            }
            this._defFname = f.name;
            this._defFilename.textContent = f.name;
            const reader = new FileReader();
            reader.onload = e => { this._defBytes = new Uint8Array(e.target.result); };
            reader.readAsArrayBuffer(f);
        };
        p.appendChild(this._defInput);
        const chooseBtn = btn('📁 Choose .def file', '#64748b', () => this._defInput.click());
        this._defFilename = el('span', 'font-size:11px;color:var(--jp-ui-font-color2);margin-left:8px;', 'No file chosen');
        const fileRow = el('div', 'display:flex;align-items:center;flex-wrap:wrap;gap:4px;');
        fileRow.appendChild(chooseBtn);
        fileRow.appendChild(this._defFilename);
        p.appendChild(fileRow);
        p.appendChild(this._label('Description (optional)'));
        this._defDesc = el('input', this._inputCss());
        this._defDesc.placeholder = 'e.g. Machine learning container with PyTorch';
        p.appendChild(this._defDesc);
        this._requestStatus = el('div', 'font-size:12px;min-height:18px;');
        p.appendChild(btn('Upload & Request', '#6366f1', () => this._requestContainer()));
        p.appendChild(this._requestStatus);
        p.appendChild(el('hr', 'border:none;border-top:1px solid var(--jp-border-color2);margin:4px 0;'));
        p.appendChild(this._label('My container requests'));
        this._myRequestsList = el('div', 'display:flex;flex-direction:column;gap:4px;');
        p.appendChild(this._myRequestsList);
    }
    async _refreshContainers() {
        this._containersList.innerHTML = '';
        try {
            const data = await this._api('GET', '/containers');
            data.containers.forEach(c => {
                const row = el('div', 'font-size:12px;padding:4px 8px;background:var(--jp-layout-color2);border-radius:4px;', `📦 ${c}`);
                this._containersList.appendChild(row);
            });
            this._loadContainers();
        }
        catch (e) {
            this._containersList.textContent = `Error: ${e}`;
        }
    }
    async _requestSimpleContainer() {
        const name = this._simpleNameInput.value.trim();
        const packages = this._simplePackagesInput.value.trim();
        if (!name) {
            this._setStatus(this._simpleStatus, 'Container name required', 'red');
            return;
        }
        if (!packages) {
            this._setStatus(this._simpleStatus, 'At least one package required', 'red');
            return;
        }
        this._setStatus(this._simpleStatus, 'Opening PR…', '#f59e0b');
        const fd = new FormData();
        fd.append('name', name);
        fd.append('packages', packages);
        fd.append('description', this._simpleDescInput.value.trim());
        fd.append('username', this._username);
        try {
            const result = await this._api('POST', '/request-container-simple', fd);
            this._setStatus(this._simpleStatus, `PR opened: ${result.pr_url}`, '#10b981');
            this._loadContainerRequests();
        }
        catch (e) {
            this._setStatus(this._simpleStatus, `Failed: ${e}`, 'red');
        }
    }
    async _requestContainer() {
        if (!this._defBytes || !this._defFname) {
            this._setStatus(this._requestStatus, 'Choose a .def file first', 'red');
            return;
        }
        this._setStatus(this._requestStatus, 'Opening PR…', '#f59e0b');
        const fd = new FormData();
        fd.append('def_file', new Blob([this._defBytes], { type: 'text/plain' }), this._defFname);
        fd.append('description', this._defDesc.value.trim());
        fd.append('username', this._username);
        try {
            const result = await this._api('POST', '/request-container', fd);
            this._setStatus(this._requestStatus, `PR opened: ${result.pr_url}`, '#10b981');
            this._loadContainerRequests();
        }
        catch (e) {
            this._setStatus(this._requestStatus, `Failed: ${e}`, 'red');
        }
    }
    async _loadContainerRequests() {
        if (!this._username || !this._myRequestsList) {
            return;
        }
        try {
            const data = await this._api('GET', `/my-container-requests/${this._username}`);
            const reqs = data.requests;
            this._myRequestsList.innerHTML = '';
            if (!reqs.length) {
                this._myRequestsList.innerHTML = '<div style="font-size:11px;color:var(--jp-ui-font-color2);">No requests yet.</div>';
                return;
            }
            const STATUS_COLOR = { pending: '#f59e0b', merged: '#10b981', closed: '#ef4444' };
            reqs.forEach(r => {
                const row = el('div', 'font-size:11px;padding:4px 8px;background:var(--jp-layout-color2);border-radius:4px;display:flex;gap:6px;align-items:center;');
                row.appendChild(el('span', `color:${STATUS_COLOR[r.status] || '#64748b'};`, '●'));
                const link = document.createElement('a');
                link.href = r.pr_url;
                link.target = '_blank';
                link.textContent = r.container;
                link.style.cssText = 'color:var(--jp-ui-font-color1);text-decoration:none;flex:1;';
                row.appendChild(link);
                row.appendChild(el('span', 'color:var(--jp-ui-font-color2);', r.status));
                this._myRequestsList.appendChild(row);
            });
        }
        catch ( /* silently ignore */_a) { /* silently ignore */ }
    }
    // ── Utilities ───────────────────────────────────────────────────────────────
    _label(text) {
        return el('div', 'font-size:11px;font-weight:600;color:var(--jp-ui-font-color2);margin-top:4px;text-transform:uppercase;letter-spacing:0.4px;', text);
    }
    _inputCss() {
        return 'width:100%;box-sizing:border-box;border:1px solid var(--jp-border-color2);' +
            'border-radius:5px;padding:5px 8px;font-size:12px;font-family:inherit;' +
            'background:var(--jp-layout-color1);color:var(--jp-ui-font-color1);outline:none;';
    }
    _setStatus(el, msg, color) {
        el.textContent = msg;
        el.style.color = color;
    }
    _esc(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
}
// ── Plugin ───────────────────────────────────────────────────────────────────
const plugin = {
    id: 'puhti-runner',
    autoStart: true,
    requires: [_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_0__.ICommandPalette, _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_1__.INotebookTracker],
    activate: (app, palette, tracker) => {
        const panel = new PuhtiWidget(tracker);
        app.shell.add(panel, 'right', { rank: 500 });
        const command = 'puhti:toggle';
        app.commands.addCommand(command, {
            label: 'Toggle Puhti Runner',
            execute: () => { app.shell.activateById(panel.id); }
        });
        palette.addItem({ command, category: 'Puhti' });
        app.commands.addKeyBinding({
            command,
            keys: ['Accel Shift P'],
            selector: 'body'
        });
    }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugin);


/***/ })

}]);
//# sourceMappingURL=lib_index_js.29126e4652a2c62154e1.js.map