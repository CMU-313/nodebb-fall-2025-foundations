'use strict';

const path = require('path');
const fs = require('fs');

const Logs = module.exports;

Logs.path = path.resolve(__dirname, '../../logs/output.log');

Logs.get = async function () {
	try {
		return await fs.promises.readFile(Logs.path, 'utf-8');
	} catch (err) {
		if (err.code === 'ENOENT') {
			// Create logs directory and empty log file if they don't exist
			const logsDir = path.dirname(Logs.path);
			await fs.promises.mkdir(logsDir, { recursive: true });
			await fs.promises.writeFile(Logs.path, '', 'utf-8');
			return '';
		}
		throw err;
	}
};

Logs.clear = async function () {
	await fs.promises.truncate(Logs.path, 0);
};
