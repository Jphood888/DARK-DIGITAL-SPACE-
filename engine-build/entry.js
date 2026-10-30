// This file, when bundled with esbuild, produces exactly the codemirror.bundle.js
// your app expects: a single script that sets window.CM with the exact shape
// dds_code_lab_for_fix.html reads from (CM.state, CM.view, CM.commands,
// CM.language, CM.autocomplete, CM.lint, CM.search, CM.themeOneDark, CM.langHtml,
// CM.langCss, CM.langJavascript, CM.langPython, CM.langJson, CM.langXml,
// CM.langMarkdown, CM.langSql).

import * as state from "@codemirror/state";
import * as view from "@codemirror/view";
import * as commands from "@codemirror/commands";
import * as language from "@codemirror/language";
import * as autocomplete from "@codemirror/autocomplete";
import * as lint from "@codemirror/lint";
import * as search from "@codemirror/search";
import { oneDark } from "@codemirror/theme-one-dark";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { markdown } from "@codemirror/lang-markdown";
import { sql } from "@codemirror/lang-sql";

window.CM = {
  state: state,
  view: view,
  commands: commands,
  language: language,
  autocomplete: autocomplete,
  lint: lint,
  search: search,
  themeOneDark: { oneDark: oneDark },
  langHtml: { html: html },
  langCss: { css: css },
  langJavascript: { javascript: javascript },
  langPython: { python: python },
  langJson: { json: json, jsonParseLinter: jsonParseLinter },
  langXml: { xml: xml },
  langMarkdown: { markdown: markdown },
  langSql: { sql: sql }
};
