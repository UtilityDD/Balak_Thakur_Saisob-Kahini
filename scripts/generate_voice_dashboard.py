#!/usr/bin/env python3
"""
generate_voice_dashboard.py
Standardized generator for Balak Thakur Voice Generation HTML Dashboards.
Parses an episode's AI Studio Voice Script Markdown file and creates an interactive,
self-contained HTML dashboard with one-click copy buttons and local progress tracking.

Usage:
    python scripts/generate_voice_dashboard.py --episode 5
    python scripts/generate_voice_dashboard.py --input path/to/Episode_XX_AI_Studio_Voice_Script.md
"""

import os
import re
import sys
import json
import argparse
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>__EPISODE_TITLE__ — Voice Generation Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Baloo+Da+2:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --bg-card: #1e293b;
      --bg-card-hover: #24344d;
      --border-color: #334155;
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --accent-gold: #f59e0b;
      --accent-green: #10b981;
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --bengali-font: 'Baloo Da 2', 'Noto Sans Bengali', sans-serif;
      --ui-font: 'Inter', system-ui, -apple-system, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--ui-font);
      line-height: 1.5;
      padding: 24px 20px 80px;
    }
    .container { max-width: 1280px; margin: 0 auto; }
    header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px 28px;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
    }
    .badge-episode {
      display: inline-block;
      background: rgba(245, 158, 11, 0.15);
      color: var(--accent-gold);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    h1 {
      font-size: 1.85rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    h1 span.bn {
      font-family: var(--bengali-font);
      font-weight: 600;
      color: #cbd5e1;
      font-size: 1.5rem;
    }
    .header-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      border: none;
    }
    .btn-primary {
      background: #2563eb;
      color: #fff;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
    }
    .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); }
    .btn-secondary { background: #334155; color: #e2e8f0; }
    .btn-secondary:hover { background: #475569; }
    .progress-section {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 16px 20px;
    }
    .progress-labels {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 0.9rem;
      font-weight: 600;
    }
    .progress-bar-bg {
      width: 100%;
      height: 10px;
      background: #334155;
      border-radius: 6px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #10b981);
      width: 0%;
      transition: width 0.3s ease;
    }
    .voice-ref-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }
    .voice-chip {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .voice-chip-info .char-name { font-weight: 600; font-size: 0.9rem; color: #f1f5f9; }
    .voice-chip-info .voice-id { font-size: 0.8rem; color: var(--accent-gold); font-weight: 600; }
    .voice-chip-info .voice-desc { font-size: 0.75rem; color: var(--text-muted); }
    .filters-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
      padding: 14px 18px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
    }
    .filter-label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-right: 4px; }
    .filter-btn {
      background: #0f172a;
      border: 1px solid var(--border-color);
      color: #cbd5e1;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-btn:hover { background: #1e293b; color: #fff; }
    .filter-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
    .scene-heading {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 32px 0 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 10px;
      color: #e2e8f0;
    }
    .scene-heading span.badge {
      font-size: 0.8rem;
      background: rgba(59, 130, 246, 0.2);
      color: #93c5fd;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 600;
    }
    .cards-list { display: flex; flex-direction: column; gap: 14px; }
    .voice-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 18px 20px;
      display: grid;
      grid-template-columns: 48px 1fr 140px;
      gap: 16px;
      align-items: start;
      transition: all 0.2s ease;
    }
    @media (max-width: 860px) {
      .voice-card { grid-template-columns: 40px 1fr; }
      .card-actions { grid-column: 1 / -1; flex-direction: row !important; justify-content: flex-end; }
    }
    .voice-card:hover { background: var(--bg-card-hover); border-color: #475569; }
    .voice-card.completed {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(16, 185, 129, 0.04);
    }
    .voice-card.completed .card-filename { color: var(--accent-green); }
    .card-check { padding-top: 4px; }
    .custom-checkbox {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 2px solid #475569;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 1rem;
      color: transparent;
    }
    .custom-checkbox:hover { border-color: var(--accent); }
    .voice-card.completed .custom-checkbox {
      background: var(--accent-green);
      border-color: var(--accent-green);
      color: #fff;
    }
    .card-content { display: flex; flex-direction: column; gap: 10px; }
    .card-header-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .card-filename {
      font-family: monospace;
      font-size: 1rem;
      font-weight: 700;
      color: #60a5fa;
      background: rgba(15, 23, 42, 0.8);
      padding: 3px 8px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .badge-speaker {
      font-size: 0.85rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .speaker-Enzo { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.4); }
    .speaker-Sola { background: rgba(245, 158, 11, 0.2); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.4); }
    .speaker-Cleo { background: rgba(236, 72, 153, 0.2); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.4); }
    .speaker-Achird { background: rgba(139, 92, 246, 0.2); color: #c4b5fd; border: 1px solid rgba(139, 92, 246, 0.4); }
    .speaker-Puck { background: rgba(20, 184, 166, 0.2); color: #5eead4; border: 1px solid rgba(20, 184, 166, 0.4); }
    .speaker-Fenrir { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); }
    .speaker-Charon { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.4); }
    .speaker-Zephyr { background: rgba(234, 179, 8, 0.2); color: #fde047; border: 1px solid rgba(234, 179, 8, 0.4); }
    .speaker-Tova { background: rgba(244, 63, 94, 0.2); color: #fda4af; border: 1px solid rgba(244, 63, 94, 0.4); }
    .speaker-Orus { background: rgba(100, 116, 139, 0.2); color: #cbd5e1; border: 1px solid rgba(100, 116, 139, 0.4); }
    .box-container {
      background: #0f172a;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 10px 14px;
      position: relative;
    }
    .box-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .box-text { font-size: 0.9rem; color: #e2e8f0; word-break: break-word; }
    .box-text.bengali {
      font-family: var(--bengali-font);
      font-size: 1.15rem;
      line-height: 1.6;
      color: #f8fafc;
      font-weight: 500;
    }
    .box-copy-btn {
      background: #334155;
      color: #cbd5e1;
      border: none;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .box-copy-btn:hover { background: var(--accent); color: #fff; }
    .card-actions { display: flex; flex-direction: column; gap: 8px; }
    .action-btn {
      width: 100%;
      background: #334155;
      border: 1px solid var(--border-color);
      color: #e2e8f0;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .action-btn:hover { background: #475569; color: #fff; }
    .action-btn.copy-all {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.3);
      color: #93c5fd;
    }
    .action-btn.copy-all:hover { background: var(--accent); color: #fff; }
    #toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid var(--accent);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 1000;
    }
    #toast.show { transform: translateY(0); opacity: 1; }
  </style>
</head>
<body>

<div class="container">
  <header>
    <div class="header-top">
      <div>
        <div class="badge-episode">__EPISODE_BADGE__ • Voice Generator Dashboard</div>
        <h1>
          <span>__EPISODE_ENGLISH_TITLE__</span>
          <span class="bn">__EPISODE_BENGALI_TITLE__</span>
        </h1>
        <p style="color: var(--text-secondary); margin-top: 6px; font-size: 0.9rem;">
          One-click copy workflow for Google AI Studio Speech (<code style="color: var(--accent-gold);">gemini-3.8-flash-tts</code>).
        </p>
      </div>
      <div class="header-actions">
        <a href="https://aistudio.google.com/generate-speech" target="_blank" class="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          Open AI Studio Speech
        </a>
        <button id="resetProgressBtn" class="btn btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
          Reset Checked
        </button>
      </div>
    </div>

    <div class="progress-section">
      <div class="progress-labels">
        <span>Recorded Progress: <strong id="progressCount">0 / __TOTAL_COUNT__</strong> clips completed</span>
        <span id="progressPercent" style="color: var(--accent-green);">0%</span>
      </div>
      <div class="progress-bar-bg">
        <div id="progressBar" class="progress-bar-fill" style="width: 0%;"></div>
      </div>
    </div>
  </header>

  <!-- Filters Bar -->
  <div class="filters-bar" id="filtersBar">
    <span class="filter-label">Filter:</span>
    <button class="filter-btn active" data-filter="all">All (__TOTAL_COUNT__)</button>
    __DYNAMIC_FILTER_BUTTONS__
    <span class="filter-label" style="margin-left: 12px;">Status:</span>
    <button class="filter-btn" data-status="pending">Pending</button>
    <button class="filter-btn" data-status="done">Completed</button>
  </div>

  <!-- Cards Container -->
  <div id="cardsList" class="cards-list"></div>
</div>

<div id="toast">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
  <span id="toastMsg">Copied to clipboard!</span>
</div>

<script>
const CLIPS_DATA = __CLIPS_JSON__;
const STORAGE_KEY = "__STORAGE_KEY__";
let checkedIds = new Set(__PRECHECKED_IDS__);

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) checkedIds = new Set(JSON.parse(saved));
  } catch (e) { console.warn("Storage load failed", e); }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...checkedIds]));
  } catch (e) { console.warn("Storage save failed", e); }
  updateProgressBar();
}

function updateProgressBar() {
  const count = checkedIds.size;
  const total = CLIPS_DATA.length;
  const pct = Math.round((count / total) * 100);
  document.getElementById("progressCount").textContent = `${count} / ${total}`;
  document.getElementById("progressPercent").textContent = `${pct}%`;
  document.getElementById("progressBar").style.width = `${pct}%`;
}

function renderCards(filter = "all", statusFilter = "all") {
  const container = document.getElementById("cardsList");
  container.innerHTML = "";
  let currentScene = "";

  CLIPS_DATA.forEach(clip => {
    const isCompleted = checkedIds.has(clip.id);
    if (statusFilter === "pending" && isCompleted) return;
    if (statusFilter === "done" && !isCompleted) return;
    if (filter !== "all" && clip.voice !== filter) return;

    if (clip.scene !== currentScene) {
      currentScene = clip.scene;
      const heading = document.createElement("div");
      heading.className = "scene-heading";
      heading.innerHTML = `<span>${currentScene}</span>`;
      container.appendChild(heading);
    }

    const card = document.createElement("div");
    card.className = `voice-card ${isCompleted ? 'completed' : ''}`;
    card.id = `card-${clip.id}`;
    card.innerHTML = `
      <div class="card-check">
        <div class="custom-checkbox" onclick="toggleClip(${clip.id})">
          ${isCompleted ? '✓' : ''}
        </div>
      </div>
      <div class="card-content">
        <div class="card-header-row">
          <span class="card-filename">${clip.filename}</span>
          <span class="badge-speaker speaker-${clip.voice}">
            <span>${clip.charName}</span> • <strong>${clip.voice}</strong>
          </span>
          <button class="box-copy-btn" onclick="copyClipVoice(${clip.id})">Copy Voice</button>
          <button class="box-copy-btn" onclick="copyClipFilename(${clip.id})">Copy Filename</button>
        </div>
        <div class="box-container">
          <div class="box-label">
            <span>Style Instructions Box</span>
            <button class="box-copy-btn" onclick="copyClipStyle(${clip.id})">Copy Style</button>
          </div>
          <div class="box-text">${clip.style}</div>
        </div>
        <div class="box-container">
          <div class="box-label">
            <span>Speech Box (Bengali)</span>
            <button class="box-copy-btn" onclick="copyClipSpeech(${clip.id})">Copy Bengali</button>
          </div>
          <div class="box-text bengali">${clip.speech}</div>
        </div>
      </div>
      <div class="card-actions">
        <button class="action-btn copy-all" onclick="copyClipAll(${clip.id})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copy All
        </button>
        <button class="action-btn" onclick="toggleClip(${clip.id})">
          ${isCompleted ? 'Mark Pending' : 'Mark Done ✓'}
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function toggleClip(id) {
  if (checkedIds.has(id)) {
    checkedIds.delete(id);
  } else {
    checkedIds.add(id);
    showToast(`Clip ${id} marked as completed!`);
  }
  saveProgress();
  const card = document.getElementById(`card-${id}`);
  if (card) {
    const isCompleted = checkedIds.has(id);
    card.classList.toggle("completed", isCompleted);
    card.querySelector(".custom-checkbox").innerHTML = isCompleted ? '✓' : '';
    const markBtn = card.querySelector(".card-actions .action-btn:last-child");
    if (markBtn) markBtn.textContent = isCompleted ? 'Mark Pending' : 'Mark Done ✓';
  }
}

function copyText(text, label = "Text") {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copied ${label}!`);
  }).catch(err => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast(`Copied ${label}!`);
  });
}

function copyClipVoice(id) {
  const c = CLIPS_DATA.find(x => x.id === id);
  if (c) copyText(c.voice, 'Voice ' + c.voice);
}
function copyClipFilename(id) {
  const c = CLIPS_DATA.find(x => x.id === id);
  if (c) copyText(c.filename, 'Filename ' + c.filename);
}
function copyClipStyle(id) {
  const c = CLIPS_DATA.find(x => x.id === id);
  if (c) copyText(c.style, 'Style instructions');
}
function copyClipSpeech(id) {
  const c = CLIPS_DATA.find(x => x.id === id);
  if (c) copyText(c.speech, 'Bengali speech');
}

function copyClipAll(id) {
  const clip = CLIPS_DATA.find(c => c.id === id);
  if (!clip) return;
  const fullText = `VOICE: ${clip.voice}\\n\\nSTYLE:\\n${clip.style}\\n\\nSPEECH:\\n${clip.speech}`;
  copyText(fullText, `Clip ${id} info`);
}

let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById("toast");
  const msgEl = document.getElementById("toastMsg");
  msgEl.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove("show"); }, 2200);
}

let currentFilter = "all";
let currentStatus = "all";

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.filter !== undefined) {
      document.querySelectorAll(".filter-btn[data-filter]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
    } else if (btn.dataset.status !== undefined) {
      if (btn.classList.contains("active")) {
        btn.classList.remove("active");
        currentStatus = "all";
      } else {
        document.querySelectorAll(".filter-btn[data-status]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentStatus = btn.dataset.status;
      }
    }
    renderCards(currentFilter, currentStatus);
  });
});

document.getElementById("resetProgressBtn").addEventListener("click", () => {
  if (confirm("Reset your completed checks back to initial state?")) {
    checkedIds = new Set(__PRECHECKED_IDS__);
    saveProgress();
    renderCards(currentFilter, currentStatus);
    showToast("Progress reset");
  }
});

loadProgress();
updateProgressBar();
renderCards();
</script>
</body>
</html>
"""

def parse_markdown_script(md_content):
    """Parses standardized AI Studio voice script markdown into structured clip list."""
    lines = md_content.splitlines()
    clips = []
    current_scene = "General"
    current_clip = None
    clip_id = 1
    
    scene_header_re = re.compile(r'^##\s+(?:Scene\s+)?(.+)')
    clip_header_re = re.compile(r'^###\s+(\d+\.?\s*)?`?([A-Za-z0-9_]+\.wav)`?')
    char_re = re.compile(r'-\s+\*\*Character:\*\*\s*(.+)')
    voice_re = re.compile(r'-\s+\*\*AI Studio Voice:\*\*\s*[\*`]*([A-Za-z0-9_]+)[\*`]*')
    
    in_style = False
    in_speech = False
    style_lines = []
    speech_lines = []
    
    for line in lines:
        stripped = line.strip()
        
        # Scene header
        sm = scene_header_re.match(stripped)
        if sm and not stripped.startswith("###"):
            current_scene = sm.group(1).strip()
            continue
            
        # Clip header
        cm = clip_header_re.match(stripped)
        if cm:
            if current_clip:
                current_clip['style'] = re.sub(r'\n*---+\s*$', '', "\n".join(style_lines)).strip()
                current_clip['speech'] = re.sub(r'\n*---+\s*$', '', "\n".join(speech_lines)).strip()
                clips.append(current_clip)
                style_lines = []
                speech_lines = []
                in_style = False
                in_speech = False
            
            filename = cm.group(2)
            current_clip = {
                "id": clip_id,
                "scene": current_scene,
                "filename": filename,
                "charName": "Narrator",
                "voice": "Enzo",
                "style": "",
                "speech": ""
            }
            clip_id += 1
            continue
            
        if not current_clip:
            continue
            
        char_m = char_re.match(stripped)
        if char_m:
            current_clip["charName"] = char_m.group(1).strip()
            continue
            
        voice_m = voice_re.match(stripped)
        if voice_m:
            current_clip["voice"] = voice_m.group(1).replace("*", "").replace("`", "").strip()
            continue
            
        if stripped.startswith("- **Style Box:**"):
            in_style = True
            in_speech = False
            continue
            
        if stripped.startswith("- **Speech Box:**"):
            in_speech = True
            in_style = False
            continue
            
        if in_style:
            if stripped.startswith("```"):
                continue
            if stripped.startswith("- **") or stripped.startswith("###"):
                in_style = False
            else:
                style_lines.append(stripped)
                
        if in_speech:
            if stripped.startswith("```"):
                continue
            if stripped.startswith("- **") or stripped.startswith("###"):
                in_speech = False
            else:
                speech_lines.append(stripped)

    if current_clip:
        current_clip['style'] = re.sub(r'\n*---+\s*$', '', "\n".join(style_lines)).strip()
        current_clip['speech'] = re.sub(r'\n*---+\s*$', '', "\n".join(speech_lines)).strip()
        clips.append(current_clip)
        
    return clips

def generate_dashboard(input_md_path, output_html_path=None, episode_num=None):
    input_path = Path(input_md_path).resolve()
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)
        
    if not output_html_path:
        output_html_path = input_path.parent / f"Episode_{episode_num or 'XX'}_Voice_Generator_Dashboard.html"
        
    with open(input_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    clips = parse_markdown_script(content)
    if not clips:
        print("Error: No clips parsed from markdown. Ensure headers follow `### 1. 00_Intro.wav` convention.")
        sys.exit(1)
        
    # Extract episode titles
    title_match = re.search(r'# Episode (\d+):\s*(.+)', content)
    bn_match = re.search(r'##\s*(পর্ব\s*\d+[^(\n]+)', content)
    
    ep_badge = f"Episode {episode_num:02d}" if episode_num else "Episode"
    ep_en_title = title_match.group(2).split("(")[0].strip() if title_match else "Voice Generation"
    ep_bn_title = bn_match.group(1).strip() if bn_match else ""
    
    # Calculate voices and filter buttons
    voice_counts = {}
    for c in clips:
        voice_counts[c['voice']] = voice_counts.get(c['voice'], 0) + 1
        
    filter_buttons_html = ""
    for voice, count in voice_counts.items():
        filter_buttons_html += f'<button class="filter-btn" data-filter="{voice}">{voice} ({count})</button>\n    '
        
    storage_key = f"balak_thakur_ep{episode_num:02d}_voices_progress" if episode_num else "balak_thakur_voice_progress"
    
    # Check pre-saved clips
    prechecked = []
    if episode_num == 5:
        prechecked = [1, 2] # 00_Intro and 01a_Narrator_Kachari
        
    html = HTML_TEMPLATE
    html = html.replace("__EPISODE_TITLE__", f"Episode {episode_num or ''}")
    html = html.replace("__EPISODE_BADGE__", ep_badge)
    html = html.replace("__EPISODE_ENGLISH_TITLE__", ep_en_title)
    html = html.replace("__EPISODE_BENGALI_TITLE__", ep_bn_title)
    html = html.replace("__TOTAL_COUNT__", str(len(clips)))
    html = html.replace("__DYNAMIC_FILTER_BUTTONS__", filter_buttons_html)
    html = html.replace("__CLIPS_JSON__", json.dumps(clips, ensure_ascii=False, indent=2))
    html = html.replace("__STORAGE_KEY__", storage_key)
    html = html.replace("__PRECHECKED_IDS__", json.dumps(prechecked))
    
    with open(output_html_path, "w", encoding="utf-8") as f:
        f.write(html)
        
    print(f" Successfully generated Voice Generator Dashboard:")
    print(f" -> {output_html_path} ({len(clips)} voice clips)")

def main():
    parser = argparse.ArgumentParser(description="Generate interactive HTML Voice Dashboard from script Markdown.")
    parser.add_argument("--episode", "-e", type=int, help="Episode number (e.g. 5)")
    parser.add_argument("--input", "-i", type=str, help="Path to input Voice Script Markdown file")
    parser.add_argument("--output", "-o", type=str, help="Optional output HTML path")
    args = parser.parse_args()
    
    if args.episode:
        ep_dir = None
        for d in (WORKSPACE_ROOT / "03_Episodes").glob(f"Episode_{args.episode:02d}*"):
            if d.is_dir():
                ep_dir = d
                break
        if not ep_dir:
            print(f"Error: Could not locate directory for Episode {args.episode}")
            sys.exit(1)
            
        input_md = ep_dir / "01_Script_and_Storyboard" / f"Episode_{args.episode:02d}_AI_Studio_Voice_Script.md"
        out_html = ep_dir / "01_Script_and_Storyboard" / f"Episode_{args.episode:02d}_Voice_Generator_Dashboard.html"
        generate_dashboard(input_md, out_html, episode_num=args.episode)
    elif args.input:
        generate_dashboard(args.input, args.output)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
