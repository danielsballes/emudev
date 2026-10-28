<script setup>
import { javascript } from '@codemirror/lang-javascript';
import { basicSetup, EditorView } from 'codemirror';
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

const props = defineProps({
  modelValue: { type: String, required: true },
  label: { type: String, required: true },
});
const emit = defineEmits(['update:modelValue']);

// One theme for every era: colors and fonts come from the era tokens.
const eraTheme = EditorView.theme({
  '&': { backgroundColor: 'var(--era-surface)', color: 'var(--era-ink)', height: '100%' },
  '.cm-content': {
    fontFamily: "'Atkinson Hyperlegible Mono', ui-monospace, monospace",
    caretColor: 'var(--era-ink)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--era-surface)',
    color: 'var(--era-ink-dim)',
    border: 'none',
  },
  '&.cm-focused': { outline: 'var(--era-border-width) solid var(--era-focus)' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'transparent' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--era-ink-dim)',
  },
});

const host = ref(null);
const view = shallowRef(null);

onMounted(() => {
  view.value = new EditorView({
    parent: host.value,
    doc: props.modelValue,
    extensions: [
      basicSetup,
      javascript(),
      eraTheme,
      EditorView.contentAttributes.of({ 'aria-label': props.label }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          emit('update:modelValue', update.state.doc.toString());
        }
      }),
    ],
  });
});

watch(
  () => props.modelValue,
  (value) => {
    const editor = view.value;
    if (editor && value !== editor.state.doc.toString()) {
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
    }
  },
);

onBeforeUnmount(() => view.value?.destroy());
</script>

<template>
  <div ref="host" class="min-h-64 font-code text-base frame" />
</template>
