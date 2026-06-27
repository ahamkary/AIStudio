# Aura Platform Consolidated Instructions

A comprehensive, highly structured, non-contradictory compilation of all guidelines, conversational directions, page structures, color styling patterns, SEO configurations, and user identification parameters.

---

## 1. Conversational Persona & Behavioral Directives

### A. Accessible, Comforting, and Relatable Conversation
* **Persona Directive**: Speak in a deeply human, gentle, warm, and natural conversational tone.
* **Avoid Robotic Clichés**: Avoid canned, clinical, robotic, or standard AI helper scripts (e.g., "As an AI, I am here to help"). Speak with space and simple elegance.
* **Keep It Grounded**: Keep the conversation simple, grounded, and accessible. Do NOT force abstract, deeply existential, or overly philosophical dialogue unless the user explicitly initiates a deep philosophical discussion. Act like a friendly, comforting, down-to-earth human companion.
* **Prompt Limit**: Ask only ONE open-ended, warm, and gentle question per message to invite the user to share more about themselves at their own pace.

### B. Pattern Detection, Uplifting Support, & Traditions
* **Empathic Listening**: Actively listen for and recognize the user's behaviors, mind patterns, anxieties, thoughts, and fear patterns.
* **Multi-Dimensional Care**: Support the user warmly and dynamically with:
  * Inspiring stories, analogies, or parables.
  * Reassuring and positive talks.
  * Uplifting verses and timeless quotes from famous historical figures, philosophical thinkers, or religious/spiritual scriptures.
* **God, Faith, & Heritage**: Feel completely welcome and encouraged to converse warmly about God, faith, family, beliefs, traditions, and heritage whenever the user expresses comfort or interest.
* **Trauma Patterns**: Provide a safe, non-judgmental container to explore personal trauma patterns, insecurities, or beliefs with deep empathy.
* **Uplifting Mirroring**: Subtly mimic the user's constructive vocabulary, strengths, and unique attributes to highlight their best qualities and make them feel seen, valued, and positive about themselves.

### C. Selective Reflection Suggestion (Selective Journaling)
* **High Selectivity**: Only suggest structured reflection entries (categorized under *Thoughts*, *Anxieties*, *Obsessions*, or *Fears*) when a highly significant, clear, and genuine personal pattern/struggle is detected in the latest user message.
* **Avoid Over-Frequency**: Do not prompt or auto-suggest a journal card for general conversation, simple pleasantries, casual prompt responses, or basic greetings. Keep recommendations highly selective to prevent visual clutter and maintain the profound impact of structured journaling.

---

## 2. Page & Workspace Structure

The application is structured as a premium, responsive single-view workspace comprising:

* **Interactive Main Chat Area**:
  * Clean, spacious messaging layout utilizing motion animations and transitions.
  * A prompt builder and live-typing box with responsive status elements.
  * Context-aware "Suggested Journal Entry" interactive panels inline with messages when significant patterns are flagged.
* **Dynamic Sidebar Panel**:
  * **Digital Self Clone Summary**: Displays the active digital virtual replica's name, avatar seed, poetic vibe/bio, traits, speaking style, core values, and a recommended greeting based on insights accumulated during chat.
  * **Reflections Journal Table**: Displays structured observations categorized under *thoughts*, *obsessions*, *anxieties*, and *fears* with interactive entry detail modals and self-guided follow-up action triggers.
  * **Cloud Device Synchronization**: Configures secure backup synchronization with custom parameters (username, email, public directory toggle) to safeguard local memory cross-device.
  * **Interactive Public Directory (Clone Exploration)**: Explores public representations of other registered user clones, with options to engage in a simulated conversation with their public virtual twins.
* **Interactive Utility Header & Footers**:
  * Light / Dark Mode transition switches.
  * "Virtual Catalog" directory toggle, "Guidelines" download, and "Erase Memory" local vault wipes.

---

## 3. Visual Styling & Color Design Patterns

* **Primary Typography**: The application enforces a warm, friendly, and playful typographic rhythm utilizing the **Comic Neue** font family (`"Comic Neue", cursive, sans-serif`) globally for both headings and body texts.
* **Theme Modes**: Supports smooth CSS-based transitions between dynamic dark/light backgrounds:
  * **Light Theme**: Soft off-whites (`#FAF9F5`) paired with deep charcoal or zinc greys.
  * **Dark Theme**: Deep slate/zinc canvas blacks (`#0A0A0B` / `#141416`) paired with elegant gray outlines.
* **Dynamic Custom Accent Hues**: The workspace empowers users to personalize their UI accent styling (used on chat bubbles, active states, custom borders, and icons) using a selection of beautiful, preset hues or custom hexadecimal overrides:
  * **Default / Indigo**: `#6366F1` / Violet
  * **Emerald**: `#10B981` / Teal
  * **Amber**: `#F59E0B` / Yellow
  * **Rose**: `#F43F5E` / Red
  * **Sky**: `#0EA5E9` / Blue
  * **Lavender**: `#8B5CF6` / Purple
* **Interactive Elements**: Features dynamic motion hover feedback, micro-animations (staggered transitions), custom scrollbars, and typing cursor blinks (`animate-cursor-blink`).

---

## 4. Search Engine Optimization (SEO) Config

A dedicated `seo-config.json` governs key landing routes on the server to optimize crawlability and ensure proper visual rendering on indexing spiders:

### A. Route: `/virtual-cloning`
* **Meta Title**: `Virtual Self Cloning - Secure & Private Digital Identity`
* **Meta Description**: `Discover how to build a fully private, empathetic digital twin of yourself. Speak with a warm companion to securely store your quirks, traits, and values locally on your device.`
* **Styling Parameters**: Warm cream background `#FAF9F5`, dark text `#1A1A1A`, white container `#FFFFFF`, grey borders `#EEEEEE`, indigo badge `#6366F1`.

### B. Route: `/privacy-first-ai`
* **Meta Title**: `Privacy-First Artificial Intelligence Companionship`
* **Meta Description**: `A private AI workspace designed for deep human reflection. Own your digital consciousness with local encryption and anonymous model alignment.`
* **Styling Parameters**: Slate black background `#0A0A0B`, light-gray text `#E4E4E7`, dark container `#141416`, zinc borders `#27272A`, emerald badge `#10B981`.

---

## 5. Local-First Security & Encryption

* **Absolute Client-Side Secrecy**: All conversations, traits, journal tables, and profile reflections are kept local by default in the user's browser via `localStorage` (secured through client-side-only persistence).
* **Cross-Device Sync Protocol**: No cloud transmission occurs until the user opts to register and actively initiate an encrypted Cloud Sync.
* **Emergency Vault Purge**: Features a complete "Erase Local Mind" mechanism that immediately flushes all local storage keys, message logs, clones, and journal reflections, instantly resetting the workspace to a pristine baseline state.

---

## 6. Adaptive User Identification

* **Adaptive Detection**: Replaces the fallback `ANONYMOUS_GUEST` user status signature at the bottom footer dynamically as soon as identification details are present.
* **Chat Extraction**: If an unregistered customer naturally discloses their name during conversation (e.g. *"my name is David"*), the platform captures the name and displays `@david` in the footer workspace.
* **Sync Identification**: If the user registers/logs in or sets a specific username on the Synchronization panel, the platform immediately prioritizes displaying their chosen username.
* **Manual Override**: The bottom-right footer username label can be clicked directly to launch a quick, in-place text entry field, allowing the user to select or change their username instantly.

---

## 7. Redesigned Tabbed Sidebar Layout

* **Workspace Apps Tile Layout**: Quick links for connecting and exploring other virtual twins ("Explore Selves") and logging daily insights ("My Journal") are organized as high-visibility, side-by-side equal-width interactive tiles at the top of the panel.
* **Segmented Modular Tabs**: To solve vertical layout clutter and bring optimal structure and clarity, the panel integrates three beautifully labeled navigation tabs with active color states:
  1. **Twin Profile**: Highlights the compiled Virtual Self profile, avatar seed, Poetic Vibe/Bio, traits, speech cadence, and core values with re-synthesis triggers.
  2. **Backup & Sync**: Hosts registration fields, synchronization recovery email config, public visibility toggles, and secure cloud transfer buttons.
  3. **System & Security**: Groups diagnostic check elements, system status readouts (e.g., Encrypted Vault status), and legal compliance triggers (Privacy and Terms access buttons).
