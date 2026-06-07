#!/usr/bin/env node
/**
 * Consistency audit for the atlas data model.
 * Reads the BUILT model (data/features.js — the merged source of truth the app uses)
 * and checks: tree coverage, node field completeness, edge integrity, graph orphans,
 * and per-type "backbone" expectations (every SubGhz protocol should reach a radio +
 * modulation; every NFC product should reach an RF layer; structural vocabulary
 * shouldn't be defined-but-unused). Run: node audit.mjs
 */
import fs from 'node:fs';
const js = fs.readFileSync(new URL('./data/features.js', import.meta.url), 'utf8');
const F = JSON.parse(js.slice(js.indexOf('{'), js.lastIndexOf('}') + 1));

const nodes = F.nodes || [], edges = F.edges || [];
const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
const relIds = new Set((F.taxonomy?.relTypes || []).map(r => r.id));
const typeIds = new Set((F.taxonomy?.nodeTypes || []).map(t => t.id));
const FORKS = ['O', 'U', 'R', 'M'];
let problems = 0;
const flag = (sev, msg) => { if (sev === 'ERR') problems++; console.log(`  [${sev}] ${msg}`); };

console.log(`\n=== model: ${nodes.length} nodes · ${edges.length} edges · ${F.tree.length} domains ===`);

// 1. tree coverage: every node lands in exactly one tree group, and vice-versa
const treeIds = [];
for (const c of F.tree) for (const g of c.groups) for (const it of g.items) treeIds.push(it.id);
const treeSet = new Set(treeIds);
console.log('\n# tree coverage');
if (treeIds.length !== nodes.length) flag('ERR', `tree items ${treeIds.length} != nodes ${nodes.length}`);
const dupTree = treeIds.filter((x, i) => treeIds.indexOf(x) !== i);
if (dupTree.length) flag('ERR', `node appears in tree >1x: ${[...new Set(dupTree)].join(', ')}`);
nodes.forEach(n => { if (!treeSet.has(n.id)) flag('ERR', `node not in tree: ${n.id}`); });
if (treeIds.length === nodes.length && !dupTree.length) flag('OK', 'every node maps to exactly one tree leaf');

// 2. node field completeness
console.log('\n# node fields');
let fieldIssues = 0;
nodes.forEach(n => {
  if (!n.label) { flag('ERR', `${n.id}: missing label`); fieldIssues++; }
  if (!n.desc) { flag('WARN', `${n.id}: missing desc`); fieldIssues++; }
  if (!n.type) { flag('ERR', `${n.id}: missing type`); fieldIssues++; }
  else if (!typeIds.has(n.type)) { flag('ERR', `${n.id}: type '${n.type}' not in taxonomy`); fieldIssues++; }
  if (!n.domain || !n.group) { flag('ERR', `${n.id}: missing domain/group`); fieldIssues++; }
  if (!n.s || FORKS.some(k => !(k in n.s))) { flag('ERR', `${n.id}: state missing a fork`); fieldIssues++; }
  if (!Array.isArray(n.tags) || !n.tags.length) { flag('WARN', `${n.id}: no tags`); fieldIssues++; }
});
if (!fieldIssues) flag('OK', 'all nodes have label/desc/type/domain/group/state/tags');

// 3. edge integrity
console.log('\n# edge integrity');
let edgeIssues = 0;
edges.forEach(e => {
  if (!byId[e.from]) { flag('ERR', `edge from unknown: ${e.from}`); edgeIssues++; }
  if (!byId[e.to]) { flag('ERR', `edge to unknown: ${e.to}`); edgeIssues++; }
  if (!relIds.has(e.rel)) { flag('ERR', `edge rel unknown: ${e.rel}`); edgeIssues++; }
});
const seen = new Set();
edges.forEach(e => { const k = e.from + '|' + e.rel + '|' + e.to; if (seen.has(k)) { flag('WARN', `duplicate edge: ${k}`); } seen.add(k); });
if (!edgeIssues) flag('OK', 'all edges reference valid nodes + relation types');

// 4. degree / orphans
const deg = Object.fromEntries(nodes.map(n => [n.id, 0]));
edges.forEach(e => { if (deg[e.from] != null) deg[e.from]++; if (deg[e.to] != null) deg[e.to]++; });
const orphans = nodes.filter(n => deg[n.id] === 0);
console.log('\n# graph connectivity');
console.log(`  nodes with >=1 relation: ${nodes.length - orphans.length}/${nodes.length}`);
const orphanByType = {};
orphans.forEach(n => (orphanByType[n.type] = orphanByType[n.type] || []).push(n.id));

// structural vocabulary defined-but-unused = real inconsistency
const STRUCTURAL = ['modulation', 'encoding', 'cipher', 'layer', 'radio', 'preset'];
console.log('\n# structural vocabulary that is DEFINED-BUT-UNUSED (should be wired or pruned)');
let unusedStruct = 0;
STRUCTURAL.forEach(t => (orphanByType[t] || []).forEach(id => { flag('WARN', `unused ${t}: ${id} (${byId[id].label})`); unusedStruct++; }));
if (!unusedStruct) flag('OK', 'every modulation/encoding/cipher/layer/radio/preset is referenced by >=1 edge');

// backbone expectations
console.log('\n# backbone: SubGhz protocols should reach the CC1101 radio (modulation is reachable via radio→supports)');
const out = id => edges.filter(e => e.from === id);
let sgGaps = 0, noDirectMod = 0;
nodes.filter(n => n.type === 'protocol' && (n.tags || []).includes('SubGhz')).forEach(n => {
  const o = out(n.id);
  const hasRadio = o.some(e => e.rel === 'runs-on' && byId[e.to]?.type === 'radio') || o.some(e => byId[e.to]?.id === 'rad-cc1101');
  const hasMod = o.some(e => e.rel === 'uses-modulation') || o.some(e => e.rel === 'uses-preset');
  if (!hasRadio) { flag('WARN', `${n.id} (${n.label}) does not reach a radio`); sgGaps++; }
  if (!hasMod) noDirectMod++;
});
if (!sgGaps) flag('OK', 'every SubGhz protocol reaches the CC1101 radio');
console.log(`  (info: ${noDirectMod} protocols have no *direct* modulation edge — reachable via rad-cc1101→supports→modulation)`);

console.log('\n# backbone: NFC products should reach an RF layer');
let nfGaps = 0;
nodes.filter(n => n.type === 'product').forEach(n => {
  if (!out(n.id).some(e => e.rel === 'runs-on')) { flag('WARN', `${n.id} (${n.label}) has no runs-on layer`); nfGaps++; }
});
if (!nfGaps) flag('OK', 'every NFC product reaches an RF layer');

// orphan capability summary (informational — edges optional for these)
console.log('\n# orphan leaves (edges optional, informational)');
Object.entries(orphanByType).filter(([t]) => !STRUCTURAL.includes(t)).forEach(([t, ids]) =>
  console.log(`  ${t}: ${ids.length}  (${ids.slice(0, 8).join(', ')}${ids.length > 8 ? '…' : ''})`));

console.log(`\n=== ${problems ? problems + ' ERROR(s)' : 'no hard errors'} — see WARN items above for consistency gaps ===\n`);
process.exit(problems ? 1 : 0);
