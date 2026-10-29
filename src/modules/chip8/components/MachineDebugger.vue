<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { disassemble } from '../core/disassemble.js';

const props = defineProps({
  view: { type: Object, required: true },
});

const LISTING_LENGTH = 8;

const { t } = useI18n();

const hex = (value, width) => value.toString(16).toUpperCase().padStart(width, '0');

// CPU register names are technical identifiers, not translatable text.
const pointers = computed(() => [
  { name: 'PC', value: hex(props.view.pc, 3) },
  { name: 'I', value: hex(props.view.i, 3) },
  { name: 'SP', value: String(props.view.sp) },
  { name: 'DT', value: hex(props.view.delayTimer, 2) },
  { name: 'ST', value: hex(props.view.soundTimer, 2) },
]);
const stackText = computed(() => {
  const items = stack.value.map((address) => hex(address, 3)).join(' ');
  return t('modules.chip8.sandbox.stack', { items: items || t('modules.chip8.sandbox.empty') });
});

const registers = computed(() => [...props.view.v].map((value, index) => ({ index, value })));
const stack = computed(() => [...props.view.stack.subarray(0, props.view.sp)]);

// The next instructions, starting at PC, so students can follow fetch, decode and execute.
const listing = computed(() =>
  Array.from({ length: LISTING_LENGTH }, (_, offset) => {
    const address = props.view.pc + offset * 2;
    const opcode = (props.view.memory[address] << 8) | props.view.memory[address + 1];
    return { address, opcode, text: disassemble(opcode), isCurrent: offset === 0 };
  }),
);
</script>

<template>
  <div class="flex flex-col gap-4 font-ui text-sm">
    <section :aria-label="t('modules.chip8.sandbox.registers')">
      <h3 class="mb-2">{{ t('modules.chip8.sandbox.registers') }}</h3>
      <dl class="grid grid-cols-4 gap-x-4 gap-y-1">
        <div v-for="register in registers" :key="register.index" class="flex justify-between">
          <dt>{{ `V${hex(register.index, 1)}` }}</dt>
          <dd>{{ hex(register.value, 2) }}</dd>
        </div>
      </dl>
    </section>

    <section :aria-label="t('modules.chip8.sandbox.pointers')">
      <dl class="grid grid-cols-3 gap-x-4 gap-y-1">
        <div v-for="pointer in pointers" :key="pointer.name" class="flex justify-between">
          <dt>{{ pointer.name }}</dt>
          <dd>{{ pointer.value }}</dd>
        </div>
      </dl>
      <p class="mt-2">{{ stackText }}</p>
    </section>

    <section :aria-label="t('modules.chip8.sandbox.next')">
      <h3 class="mb-2">{{ t('modules.chip8.sandbox.next') }}</h3>
      <ol class="flex flex-col">
        <li
          v-for="line in listing"
          :key="line.address"
          class="grid grid-cols-[4ch_6ch_1fr] gap-3 px-1"
          :class="{ inverse: line.isCurrent }"
        >
          <span>{{ hex(line.address, 3) }}</span>
          <span>{{ hex(line.opcode, 4) }}</span>
          <span>{{ line.text }}</span>
        </li>
      </ol>
    </section>
  </div>
</template>
