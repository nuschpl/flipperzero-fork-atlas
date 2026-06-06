# Analysis data — single source of truth (graph model)

Two hand-edited files are the canonical source for the whole fork comparison.
Both deliverables are generated from them, so they never drift:

```
data/features.json    per-fork CAPABILITY matrix (tree of items)        ┐  merge +
data/structure.json   GRAPH layer: taxonomy + structural/FAP nodes + edges ┘  validate
      │  node build.mjs
      ├─► data/features.js   (window.FEATURES = {forks,lineage,taxonomy,nodes,edges,tree})
      └─► ../FEATURE-TREE.md (matrix + relationship appendix)
```

> `features.js` and `FEATURE-TREE.md` are **generated** — never edit them by hand.
> Narrative docs (`REPORT.md`, `PROVENANCE.md`, `SECURITY.md`, `sections/*.md`)
> stay hand-written; the explorer's **Documents** tab reads them live.

## Model: everything is a node; edges are relations

`build.mjs` flattens `features.json` into nodes, merges `structure.json`'s nodes,
validates every edge, and **derives the browsable tree** by grouping nodes by
`domain → group`. So structural primitives (modulations, ciphers, RF layers,
presets) and FAPs appear in the tree *and* as graph endpoints.

### `features.json` — capability matrix
```jsonc
{ "meta":{…}, "forks":[…], "lineage":{…},
  "tree":[ { "cat":"SubGhz", "bar":"var(--U)", "groups":[
    { "name":"Protocol coverage — lib/subghz/protocols", "items":[
      { "id":"sg-jarolift", "label":"jarolift", "file":"…", "desc":"≤15 words",
        "tags":["SubGhz","rolling-code"], "s":{"O":"no","U":"yes","R":"yes","M":"yes"},
        "prov":"… `code`/**bold** ok", "evi":[["origin","`271c65a96`"]], "kind":"…" } ] } ] } ] }
```

### `structure.json` — graph layer
```jsonc
{ "domains":[ {"name":"Stack & primitives","bar":"var(--O)"}, … ],   // tree order + colour
  "taxonomy":{
    "nodeTypes":[ {"id":"modulation","label":"Modulation","color":"#8ab4ff"}, … ],
    "relTypes":[ {"id":"secured-by","label":"secured by","inv":"secures"}, … ]
  },
  "typeHints":{ "nf-base":"product", "at-dict":"attack", … },   // override inferred type of capability nodes
  "nodes":[ { "id":"cph-keeloq","type":"cipher","domain":"Stack & primitives",
              "group":"Ciphers & rolling-code","label":"Keeloq NLF","desc":"…",
              "tags":["keeloq","cipher"],"s":{"O":"yes","U":"yes","R":"yes","M":"yes"},"prov":"…" }, … ],
  "edges":[ { "from":"rc-kq-dec", "to":"cph-keeloq", "rel":"secured-by" }, … ] }
```

- **State values** (`s.O/U/R/M`): `yes` ✓ · `no` ✗ · `partial` ~ · any other string = literal (`"116"`, `"RX-only"`).
- **Relation directions**: a chip shown under `rel.label` on the source node and under `rel.inv` on the target node. Edge `from`/`to` must reference existing node ids (build fails loudly otherwise).

## Common edits (future commits)
- **New protocol/capability** → add an item to `features.json`, then add its edges
  (modulation/encoding/cipher/layer) to `structure.json`.
- **New FAP** → add a `type:"fap"` node to `structure.json` (domain `Apps & FAPs`)
  with `s` = which forks bundle it; optionally an edge `provides`/`runs-on`/`attacks`.
- **New primitive** (modulation, cipher, layer, preset, radio) → add a node under
  `Stack & primitives` and wire edges.
- Then: `node build.mjs` and commit `features.json`, `structure.json`,
  the regenerated `features.js` + `FEATURE-TREE.md`.

`build.mjs` prints validation results (duplicate ids, edges referencing unknown
nodes, unknown relation types). Keep it at `validated N nodes, M edges — OK`.

## Viewing
- **Explorer tab** works from a plain `file://` open (classic `<script src>`).
- **Documents tab** needs HTTP (browsers block `file://` fetch):
  ```
  python3 -m http.server 8771 --directory .
  # → http://localhost:8771/index.html
  ```
