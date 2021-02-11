const { exec } = require('child_process');
const fs = require('fs');

const express = require('express');
const router = express.Router();

const { query, body, validationResult } = require('express-validator');
const parsePhoneNumber = require('libphonenumber-js');
const shellEscape = require('shell-escape');

router.get(
	'/',

	query('phone').not().isEmpty(),
	query('message').not().isEmpty(),

	function (req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const sendsms = (phone, message) => {
				const execution = exec(
					`gammu-smsd-inject TEXT ${phone.number} -len 1 -text ${message}`,
					(error, stdout, stderr) => {
						//	console.log(stdout);
						// if (error) {
						// 	return res.status(500).json(error).end();
						// }
						return stdout;
					}
				);

				// const stdout = execution.stdout.on('data', (data) => {
				// 	console.log(data.toString());
				// 	//	return data.toString();
				// });

				const report = {
					phone: phone.number,
					message: message,
					date: Date.now(),
				};

				// let rawData = fs.readFileSync('output.json');
				// let parsedData = JSON.parse(rawData);

				// parsedData.push({ ok: 'ok' });

				// fs.writeFileSync('output.json', JSON.stringify(parsedData));
			};

			const message = shellEscape([req.query.message]);

			const phoneNumberList = req.query.phone.split(/[,;\r\t\n]+/);

			const phoneNumberListParsed = phoneNumberList
				.map((element) => {
					return parsePhoneNumber(element, 'FR');
				})
				.filter((element) => {
					return element !== undefined;
				})
				.filter((element) => {
					return element.isValid() !== false;
				});

			if (phoneNumberListParsed.length <= 0)
				return res
					.status(400)
					.json({ error: 'Any Good Number on the list' })
					.end();

			phoneNumberListParsed.map((element) => sendsms(element, message));

			return res
				.status(201)
				.json({ res: 'Message is sent to all numbers' })
				.end();
		} catch (error) {
			return res.status(501).json(error).end();
		}
	}
);

module.exports = router;
