const selectFolderBtn = document.getElementById('select-folder');
const folderInput = document.getElementById('folder-input');
const filesDiv = document.getElementById('files');
const currentConfigPre = document.getElementById('current-config');
const serverUrlInput = document.getElementById('server-url');
const serverPortInput = document.getElementById('server-port');
const advertiseInput = document.getElementById('advertise');
const applyBtn = document.getElementById('apply');
const diffPre = document.getElementById('diff');
const downloadsDiv = document.getElementById('downloads');
const themeToggleBtn = document.getElementById('theme-toggle');
const folderFeedback = document.getElementById('folder-feedback');
const includeDefaultsInput = document.getElementById('include-defaults');
const filesListDiv = document.getElementById('files-list');
const TARGET_FILES = ['UTEngine.ini', 'UTGame.ini', 'DefaultEngine.ini', 'DefaultUI.ini'];

let fileHandles = {};
let fileContents = {};
let updatedContents = {};

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  themeToggleBtn.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
}

function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  applyTheme(saved);
}

themeToggleBtn.addEventListener('click', () => {
  const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  localStorage.setItem('theme', newTheme);
  applyTheme(newTheme);
});

initTheme();

includeDefaultsInput.addEventListener('change', updateFilesList);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setFeedback(msg, type) {
  folderFeedback.textContent = msg;
  folderFeedback.className = type;
}

function updateFilesList() {
  const names = Object.keys(fileHandles).filter(n => includeDefaultsInput.checked || !n.startsWith('Default'));
  filesListDiv.textContent = names.length ? `Files to be modified: ${names.join(', ')}` : '';
}

async function readFile(handle) {
  const file = await handle.getFile();
  return await file.text();
}

async function handleDirectory(dirHandle) {
  fileHandles = {};
  fileContents = {};
  updatedContents = {};
  filesDiv.textContent = '';
  async function traverse(handle, path) {
    for await (const [name, entry] of handle.entries()) {
      const current = path ? `${path}/${name}` : name;
      if (entry.kind === 'file') {
        if (TARGET_FILES.includes(name)) {
          fileHandles[name] = entry;
          const text = await readFile(entry);
          fileContents[name] = text;
          const div = document.createElement('div');
          div.textContent = `Loaded ${current}`;
          filesDiv.appendChild(div);
        }
      } else if (entry.kind === 'directory') {
        await traverse(entry, current);
      }
    }
  }

  await traverse(dirHandle, '');

  const hasActive = fileHandles['UTEngine.ini'] && fileHandles['UTGame.ini'];
  const hasDefault = fileHandles['DefaultEngine.ini'] && fileHandles['DefaultUI.ini'];
  if (hasActive || hasDefault) {
    setFeedback('Success: UT3 configuration files loaded.', 'success');
  } else {
    setFeedback('Error: No UT3 configuration files were found. Please select your game install or user config folder.', 'error');
  }
  if (Object.keys(fileHandles).length === 0) {
    currentConfigPre.textContent = 'No config files found.';
  } else {
    const combined = Object.entries(fileContents)
      .map(([name, txt]) => `-- ${name} --\n${txt}`)
      .join('\n');
    currentConfigPre.textContent = combined;
  }
  updateFilesList();
}

selectFolderBtn.addEventListener('click', async () => {
  if (window.showDirectoryPicker) {
    try {
      const dir = await window.showDirectoryPicker();
      await handleDirectory(dir);
    } catch (e) {
      console.error(e);
    }
  } else {
    folderInput.click();
  }
});

folderInput.addEventListener('change', async (e) => {
  const files = e.target.files;
  fileHandles = {};
  fileContents = {};
  updatedContents = {};
  filesDiv.textContent = '';
  for (const file of files) {
    if (TARGET_FILES.includes(file.name)) {
      const text = await file.text();
      fileHandles[file.name] = file;
      fileContents[file.name] = text;
      const div = document.createElement('div');
      div.textContent = `Loaded ${file.webkitRelativePath}`;
      filesDiv.appendChild(div);
    }
  }
  const combined = Object.entries(fileContents)
    .map(([name, txt]) => `-- ${name} --\n${txt}`)
    .join('\n');
  currentConfigPre.textContent = combined || 'No config files found.';
  const hasActive = fileHandles['UTEngine.ini'] && fileHandles['UTGame.ini'];
  const hasDefault = fileHandles['DefaultEngine.ini'] && fileHandles['DefaultUI.ini'];
  if (hasActive || hasDefault) {
    setFeedback('Success: UT3 configuration files loaded.', 'success');
  } else {
    setFeedback('Error: No UT3 configuration files were found. Please select your game install or user config folder.', 'error');
  }
  updateFilesList();
});

function validateInputs() {
  const url = serverUrlInput.value.trim();
  const port = parseInt(serverPortInput.value, 10);
  if (!/^https?:\/\//i.test(url)) {
    alert('Please enter a valid URL (must start with http:// or https://)');
    return false;
  }
  if (isNaN(port) || port < 1 || port > 65535) {
    alert('Please enter a valid port between 1 and 65535');
    return false;
  }
  return true;
}

function applyChanges() {
  updatedContents = {};
  const url = serverUrlInput.value.trim();
  const port = serverPortInput.value.trim();
  const advertise = advertiseInput.checked ? 'True' : 'False';
  const updates = {
    'MasterServerURL': url,
    'MasterServerPort': port,
    'bAdvertiseServer': advertise
  };
  const diffParts = [];
  updateFilesList();
  for (const [name, text] of Object.entries(fileContents)) {
    if (!includeDefaultsInput.checked && name.startsWith('Default')) {
      continue;
    }
    const lines = text.split(/\r?\n/);
    const keys = Object.keys(updates);
    const regexes = keys.map(k => new RegExp('^' + escapeRegex(k) + '\\s*=','i'));
    const updated = new Set();
    for (let i = 0; i < lines.length; i++) {
      for (let j = 0; j < keys.length; j++) {
        if (regexes[j].test(lines[i])) {
          diffParts.push(`${name}: ${lines[i]} -> ${keys[j]}=${updates[keys[j]]}`);
          lines[i] = `${keys[j]}=${updates[keys[j]]}`;
          updated.add(keys[j]);
        }
      }
    }
    keys.forEach(k => {
      if (!updated.has(k)) {
        diffParts.push(`${name}: add ${k}=${updates[k]}`);
        lines.push(`${k}=${updates[k]}`);
      }
    });
    updatedContents[name] = lines.join('\n');
  }
  diffPre.textContent = diffParts.join('\n');
  downloadsDiv.innerHTML = '';
  for (const [name, txt] of Object.entries(updatedContents)) {
    const blob = new Blob([txt], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.textContent = `Download ${name}`;
    a.style.display = 'block';
    downloadsDiv.appendChild(a);
  }
}

applyBtn.addEventListener('click', () => {
  if (!validateInputs()) return;
  if (Object.keys(fileContents).length === 0) {
    alert('No configuration files loaded.');
    return;
  }
  applyChanges();
});
