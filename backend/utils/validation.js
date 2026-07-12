import dns from 'dns/promises';
import net from 'net';
import crypto from 'crypto';
import { config } from '../config.js';

const PRIVATE_IPV4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
];

export const createSourceId = (type) => `${type}_${crypto.randomUUID()}`;

export const cleanFilename = (name = 'document.pdf') => name
  .normalize('NFKC')
  .replace(/[\x00-\x1f\x7f/\\]/g, '_')
  .slice(0, 120);

export const validateText = (text) => {
  if (typeof text !== 'string' || !text.trim()) {
    throw Object.assign(new Error('Text content is required'), { status: 400 });
  }
  if (text.length > config.maxTextChars) {
    throw Object.assign(new Error(`Text content exceeds ${config.maxTextChars} characters`), { status: 413 });
  }
  return text.trim();
};

export const validateChatMessage = (message) => {
  if (typeof message !== 'string' || !message.trim()) {
    throw Object.assign(new Error('Message is required'), { status: 400 });
  }
  if (message.length > config.maxChatChars) {
    throw Object.assign(new Error(`Message exceeds ${config.maxChatChars} characters`), { status: 413 });
  }
  return message.trim();
};

const isPrivateAddress = (address) => {
  if (net.isIPv4(address)) return PRIVATE_IPV4.some((pattern) => pattern.test(address));
  const normalized = address.toLowerCase();
  return normalized === '::1' || normalized === '::' || normalized.startsWith('fe80:') ||
    normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('::ffff:127.') ||
    normalized.startsWith('::ffff:10.') || normalized.startsWith('::ffff:192.168.');
};

export const validatePublicUrl = async (rawUrl) => {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw Object.assign(new Error('Enter a valid website URL'), { status: 400 });
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw Object.assign(new Error('Only public HTTP(S) URLs are supported'), { status: 400 });
  }
  if (url.hostname === 'localhost' || url.hostname.endsWith('.local')) {
    throw Object.assign(new Error('Private network URLs are not allowed'), { status: 400 });
  }

  let addresses;
  try {
    addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  } catch {
    throw Object.assign(new Error('The website hostname could not be resolved'), { status: 400 });
  }
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw Object.assign(new Error('Private network URLs are not allowed'), { status: 400 });
  }
  return url;
};
