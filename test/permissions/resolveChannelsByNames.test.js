import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveChannelsByNames } from '../../src/permissions/resolveChannelsByNames.js';
import { fakeGuild } from '../../test-support/fakeDiscord.js';

const guild = fakeGuild({
  channels: [
    { id: '10', name: 'annonces' },
    { id: '11', name: 'general' },
  ],
});

test('résout un nom exact', () => {
  const [result] = resolveChannelsByNames(guild, ['general']);
  assert.equal(result.channel.id, '11');
});

test('tolère un préfixe "#"', () => {
  const [result] = resolveChannelsByNames(guild, ['#general']);
  assert.equal(result.channel.id, '11');
});

test('résout une mention <#id>', () => {
  const [result] = resolveChannelsByNames(guild, ['<#10>']);
  assert.equal(result.channel.id, '10');
});

test('signale un salon introuvable en gardant le texte brut', () => {
  const [result] = resolveChannelsByNames(guild, ['#inexistant']);
  assert.equal(result.channel, undefined);
  assert.equal(result.raw, '#inexistant');
});
