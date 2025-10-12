'use strict';

const path = require('path');
const fs = require('fs');

const Logs = module.exports;

Logs.path = path.resolve(__dirname, '../../logs/output.log');

Logs.get = async function () {
	try {
		return await fs.promises.readFile(Logs.path, 'utf-8');
	} catch (err) {
		// If the file doesn't exist, return empty logs instead of throwing.
		if (err && err.code === 'ENOENT') {
			return '';
		}
		throw err;
	}
};

Logs.clear = async function () {
	try {
		// Ensure directory exists
		await fs.promises.mkdir(path.dirname(Logs.path), { recursive: true });
		// If file doesn't exist, create it; otherwise truncate
		await fs.promises.open(Logs.path, 'a').then(fh => fh.close());
		await fs.promises.truncate(Logs.path, 0);
	} catch (err) {
		// If something unexpected happens, rethrow
		if (err && err.code !== 'ENOENT') {
			throw err;
		}
	}
};
