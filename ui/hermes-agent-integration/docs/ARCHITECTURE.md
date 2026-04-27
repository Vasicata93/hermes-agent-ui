# ◈ PERPLEX AGENT — ARHITECTURĂ v2.0

### Fișă Tehnică Completă pentru Implementare

---

## SISTEME GLOBALE (transversale — active pe tot parcursul execuției)

| Sistem | Descriere |
| --- | --- |
| **COST GUARD** | Maxim tokens, tool calls și iterații per request. Monitorizat continuu. |
| **CONFIDENCE SYSTEM** | Scor `high / medium / low` generat per răspuns, afișat în UI. |

---

## ORDINEA EXECUȚIEI

```
REQUEST PRIMIT
      ↓
[1]  SYSTEM CONTEXT     → stabil, din cache
      ↓
[2]  MEMORY LOAD        → retrieval selectiv (episodic + semantic + procedural + RAG)
      ↓
[3]  PERCEPTION         → intent + situation + goals + events  ← TIMESTAMP INTRĂ AICI
      ↓
[4]  ROUTING            → complexitate → mod operare; tool state machine; skill injection
      ↓
[5]  THINKING           → Chat Mode (5 pași) sau Agent Mode (9 pași + TODO List)
      ↓
[6]  PRE-TOOL SAFETY    → write guard + sensitive data filter
      ↓
[7]  TOOLS              → READ liber / WRITE cu confirmare; externalizare >5000 tokens
      ↓
[8]  POST-TOOL SAFETY   → recursion limit + sanity check + frustration detector
      ↓
[9]  RESPONSE           → format + confidence score + proactive + citations
      ↓
[10] LEARNING           → SYNC: critical memory │ ASYNC: summaries + patterns
           ↕
     UI SYSTEM          → sistem separat, subscrie la events, nu blochează execuția
```

---

## LAYER 1 — SYSTEM CONTEXT
> **Static · Cached · Construit o singură dată per sesiune**
JSON serialization deterministă cu chei sortate. Timestamp-ul NU este inclus aici.

### 1.1 IDENTITY
- Personalitate, ton și stil de comunicare
- Capabilități declarate și limitări cunoscute
- Valori și principii comportamentale

### 1.2 CORE SKILLS *(mereu active, cached)*
| Skill | Descriere |
| --- | --- |
| Răspuns în limba userului | Auto-detect limbă la fiecare mesaj |
| Calendar awareness | Protocol complet pentru operațiuni pe calendar |
| Library / Notion operations | Read/write pe pagini, blocuri, tabele |
| Widget și vizualizare | Grafice, diagrame, componente UI interactive |
| Safety protocol | Write ops cer confirmare. Excepție: `execute_code` în sandbox |

### 1.3 TOOL DEFINITIONS *(toate tools, mereu prezente — niciodată eliminate)*
> ⚑ **DECIZIE:** Tool definitions sunt STATICE în Layer 1. Niciodată eliminate dinamic — doar mascate prin Tool State Machine din Layer 4.

**READ Tools** *(fără confirmare)*
`search · list_events · read_page · get_time · rag_search · get_workspace_map · search_workspace_files · read_workspace_files · search_memory`

**WRITE Tools** *(necesită confirmare sau PendingAction)*
`add_event · update_event · delete_event · create_page · update_page · insert_block · replace_block · delete_block · update_table_cell · save_memory · execute_code`

### 1.4 BEHAVIORAL RULES
- Erorile **rămân în context** — nu se șterg, nu se ascund. Sunt resurse pentru recovery.
- Context **append-only** — nu se modifică retroactiv niciun mesaj sau observație.
- Observații mari **(>5000 tokens)** → externalizate în RAG. Rămâne: `path + titlu + 100 token summary`
- **Fallback protocol** activ la orice eșec de tool sau execuție.

---

## LAYER 2 — MEMORY
> **Semi-static · Refreshed per conversație · Retrieval SELECTIV**
> ⚑ **DECIZIE:** Memory retrieval este SELECTIV bazat pe relevanță — nu se face preload complet. Costul contextului contează.

### 2.1 EPISODIC MEMORY
Rezumate conversații anterioare, taskuri completate cu rezultate, momente importante. Format: `[DATA] [TOPIC] [REZUMAT] [OUTCOME]`

### 2.2 SEMANTIC MEMORY
- Profil user: nume, locație, profesie, bio
- Proiecte active cu status și next step
- Preferințe declarate și detectate
- Decizii importante

### 2.3 PROCEDURAL MEMORY
- Format răspuns preferat (lungime, structură, detaliu)
- Ce apreciază / ce frustrează utilizatorul
- Patterns de comunicare detectate

### 2.4 VECTOR STORE — RAG
- Library pages, Space files, documente uploadate
- Observații mari externalizate din sesiuni active

### 2.5 WORKING MEMORY *(append-only în sesiunea curentă)*
- Ultimele **8-10 mesaje** (sliding window)
- Tool results din iterația curentă
- Facts colectate în sesiunea prezentă
- Starea curentă a **TODO List**

---

## LAYER 3 — PERCEPTION
> **Dinamic · Per mesaj · Primul procesor al inputului nou**
> ⚑ **DECIZIE:** Timestamp-ul este injectat AICI, la finalul contextului — NU în Layer 1. Maximizează KV-cache hit rate pe System Context.

### 3.1 TEMPORAL INJECTION *(la finalul contextului)*
- Data și ora curentă
- Calendar azi (dacă relevant)
- Context sesiune: durată, număr mesaje

### 3.2 INPUT PARSING
- Ce spune utilizatorul literal
- Intenția reală din spatele mesajului
- Ton și stare emoțională
- Urgență detectată

### 3.3 SITUATION MODEL
- Unde suntem în proiect / task curent
- Ce s-a schimbat față de mesajul anterior
- Ce context din memorie este relevant acum

### 3.4 GOAL AWARENESS
- Obiectivul principal al sesiunii
- Subgoaluri active cu status
- Ce rămâne nerealizat

### 3.5 EVENT DETECTION
> ⚑ **DECIZIE:** Event Detection rămâne ca funcționalitate distinctă. Nu se elimină — este necesară pentru comportament proactiv.
- Urgență sau prioritate ridicată
- Schimbări importante de direcție
- Oportunități detectate
- Blocaje sau frustrare

---

## LAYER 4 — ROUTING
> **Decizie · Per mesaj · Mod de operare + Skill Injection**

### 4.1 COMPLEXITY ASSESSMENT
| Nivel | Tratament |
| --- | --- |
| **SIMPLU** | Chat Mode — salut, întrebare factuală, clarificare |
| **MEDIU** | Chat Mode + Tools — 1-2 tool calls |
| **COMPLEX** | Agent Mode — multi-step, cod, research extensiv |
| **AMBIGUU** | Clarify First — întreabă concis ce lipsește |

### 4.2 TOOL STATE MACHINE *(inovație Manus)*
> Tools sunt MEREU definite în Layer 1. Routing decide care sunt ACTIVE prin **prefix masking** — nu prin eliminare.

| State | Comportament |
| --- | --- |
| `idle` | Toate tools disponibile |
| `writing` | Read tools blocate |
| `confirming` | Toate tools blocate — așteptăm confirmare |
| `error` | Retry sau fallback |

### 4.3 PRIORITY ENGINE
| Prioritate | Tratament |
| --- | --- |
| Urgent + Important | Execuție imediată |
| Important | Planificare și confirmare |
| Rutină | Execuție directă |
| Opțional | Menționează, nu executa |

### 4.4 SKILL INJECTION *(Context Augmentation dinamic)*
> ⚑ **DECIZIE:** Skill Injection rămâne distinct. Distincția cached vs dinamic este fundamentală pentru eficiența KV-cache.

| Tip | Mecanism |
| --- | --- |
| **CORE** | Mereu active, prezente în Layer 1 (cached) |
| **SITUATIONAL** | Injectate dinamic de Router: `coding_skill · research_skill · finance_skill · writing_skill · data_analysis_skill` |
| **ON-DEMAND** | Activate la cerere explicită — nu injectate automat |

---

## LAYER 5 — THINKING
> **Execuție · Chat Mode (5 pași) sau Agent Mode (9 pași)**
> ⚑ **DECIZIE:** Thinking Protocol rămâne detaliat cu 9 pași. Structura este în COD, nu în prompt. Condensarea la 4 pași elimină granularitatea pentru proactivitate și critică.

### 5A. CHAT MODE *(taskuri simple și medii)*
```
STEP 1 — UNDERSTAND      → intenția reală
STEP 2 — MEMORY CHECK    → ce știu deja relevant
STEP 3 — TOOL CHECK      → e nevoie de search / calendar?
STEP 4 — RESPOND         → direct, concis
STEP 5 — UPDATE          → actualizează working memory
```

### 5B. AGENT MODE *(taskuri complexe, multi-step)*
**STEP 1 — CLARIFY**
- Intenție reală și scop final
- Informații lipsă critice
- Dacă lipsesc esențiale → o singură întrebare concisă

**STEP 2 — DECOMPOSE**
- Subtaskuri atomice executabile
- Dependențe identificate
- Resurse necesare per subtask

**STEP 3 — PLAN** *(vizibil în UI)*
- Ordonează subtaskurile după dependențe
- Alege tools adecvate
- Afișează planul în Plan Panel

**STEP 4 — TODO LIST ACTIVATION** *(inovație Manus)*
> Agentul creează `todo.txt` intern, rescris la **FIECARE iterație**, bifând completatele. Lista stă la **FINALUL contextului** — anti *"lost in the middle"*.

**STEP 5 — EXECUTE**
- Un singur subtask pe iterație
- Tool calls cu date neutre, fără predicție prematură
- Observații >5000 tokens → externalizate în RAG, rămâne summary
- Erorile RĂMÂN în context

**STEP 6 — PREDICT** *(după datele colectate, nu înainte)*
> ⚑ **DECIZIE:** PREDICT se face DUPĂ execute — evită confirmation bias. Agentul nu caută date care să confirme o predicție prematură.
- Ce urmează logic din date
- Ce poate merge greșit
- Ce va întreba utilizatorul
- Pregătește răspunsuri proactive

**STEP 7 — VERIFY**
- Corectitudinea datelor obținute
- Contradicții între surse
- Incertitudini nedeclarate
- Activează recovery dacă necesar

**STEP 8 — CRITIQUE**
- Răspunde la nevoia reală sau doar la cea declarată?
- Este răspunsul acționabil?
- Există gaps critice?
- Revizuiește dacă critica identifică probleme

**STEP 9 — SYNTHESIZE**
- Combină rezultatele
- Structurează pentru claritate
- Adaugă vizualizări unde aduc valoare
- Pregătește output-ul final pentru Response

---

## LAYER 6 — PRE-TOOL SAFETY
> **Filtru înainte de execuția tools**

### 6.1 WRITE OPERATION GUARD
> Orice WRITE tool → verifică că există confirmare / PendingAction. Dacă nu → **blochează** și întreabă. Excepție: `execute_code` în sandbox izolat.

### 6.2 SENSITIVE DATA FILTER
- Date personale nu ies în search queries externe
- API keys nu se loghează în niciun context
- Date din memorie nu se expun inutil

---

## LAYER 7 — TOOLS
> **Execuție · Tool State Machine activ · Fallback Protocol**

### 7.1 READ TOOLS *(fără confirmare)*
`search · fetch_url · list_calendar_events · get_current_time · get_calendar_holidays · get_page_structure · rag_search · get_workspace_map · search_workspace_files · read_workspace_files · search_memory`

### 7.2 WRITE TOOLS *(cu confirmare sau PendingAction)*
`add_calendar_event · update_calendar_event · delete_calendar_event · create_page · update_page · insert_block · replace_block · delete_block · update_table_cell · save_memory · execute_code`

### 7.3 FALLBACK PROTOCOL
| Situație | Acțiune |
| --- | --- |
| Tool eșuează | Alternativa: search eșuează → reformulează query; read_file → search_files |
| Date contradictorii | Caută a treia sursă |
| Task imposibil | Explică motivul, propune alternativa viabilă |
| Timeout | Livrează ce are, notifică lipsa explicit |

### 7.4 CONTEXT EXTERNALIZATION *(inovație Manus)*
- Observație **>5000 tokens** → scrisă în RAG
- Rămâne în context: `path + titlu + 100 token summary`
- Agentul poate reciti din RAG oricând are nevoie de detalii

---

## LAYER 8 — POST-TOOL SAFETY
> **Filtru după execuție · Recursion Limit · Sanity Check**

### 8.1 RECURSION LIMITER
| Limită | Comportament |
| --- | --- |
| Max iterații Agent Mode | **10** |
| La iterația 8 | Notifică utilizatorul |
| La iterația 10 | Livrează ce are, explică ce lipsește |
| Tool retry max | **3 încercări** per tool call |

### 8.2 FRUSTRATION DETECTOR
- Utilizatorul repetă același lucru **>2 ori** → schimbă abordarea
- Ton negativ detectat → simplificare imediată
- Contradicție explicită → acceptă și adaptează fără rezistență

### 8.3 RESPONSE SANITY CHECK
- Informații reale sau risc de halucinație?
- Citările există în contextul actual?
- Write operations au confirmare?

---

## LAYER 9 — RESPONSE
> **Livrare · Format · Confidence Score · Proactiv**

### 9.1 FORMAT SELECTION
| Format | Când |
| --- | --- |
| Text simplu | Chat conversațional, salut, răspuns direct |
| Markdown | Explicații structurate, liste, cod |
| Widget / Chart | Date vizualizabile |
| Cod cu output | Rezultat după `execute_code` |
| Confirmare UI | Când WRITE tool necesită confirmare |

### 9.2 CONFIDENCE SCORE
- `high` — informații verificate din surse multiple
- `medium` — parțial verificate sau o singură sursă
- `low` — incertitudine ridicată, notifică explicit

### 9.3 PROACTIVE ADDITIONS
- Next steps logici (nesolicitați)
- Avertismente din PREDICT step
- Follow-up anticipat din patterns
- Oportunități din Event Detection

### 9.4 CITATIONS
- Format `[1][2]` cu link-uri funcționale
- Niciodată inventate — dacă nu există în context, nu se citează

### 9.5 LANGUAGE
- Întotdeauna în limba mesajului — auto-detect activ per iterație

---

## LAYER 10 — LEARNING
> **Post-response · SYNC pentru critice · ASYNC pentru rest**
> ⚑ **DECIZIE:** Learning split SYNC/ASYNC — SYNC blochează pentru actualizări critice, ASYNC rulează după livrare pentru latență minimă.

### 10.1 SYNC *(rulează imediat, blochează până completat)*
- **Critical memory updates** — fapte importante noi
- **Task state** — marchează completate / neterminate

### 10.2 ASYNC *(rulează după livrarea răspunsului)*
**EPISODE SAVE**
- Rezumă conversația în 3-5 propoziții
- Salvează în Episodic Memory
- Format: `[DATA] [TOPIC] [CE S-A ÎNTÂMPLAT] [OUTCOME]`

**PROFILE UPDATE**
- Facts noi → Semantic Memory
- Preferințe detectate → Procedural Memory
- Status proiecte actualizat

**PROACTIVITY PREP**
- Ce să aducă în atenție la următoarea conversație
- Patterns detectate
- Connections între proiecte

---

## UI SYSTEM *(separat, nu în pipeline cognitiv)*
> Subscrie la events generate de pipeline. Nu blochează execuția. Actualizări asincrone.

### Plan Panel
Lista subtaskurilor cu status actualizat live:
`✓ completat · ⟳ în progres · ○ în așteptare · ✗ eșuat`

### Action Feed
- Tool calls cu argumentele rezumate
- Results cu preview
- Erori cu motivul și acțiunea alternativă
- Timp per acțiune

### Thinking Indicator
- **Chat Mode** → spinner simplu
- **Agent Mode** → ThinkingBar cu pasul curent
- **Reasoning** → expandabil la cerere

### Memory Panel *(toggle)*
- Ce știe agentul despre tine
- Facts active din sesiunea curentă
- TODO List curentă
