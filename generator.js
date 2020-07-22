'use strict';
const Sqrl = require('squirrelly');
const path = require('path');
const fs = require('fs');

Sqrl.defaultConfig.autoEscape = false;

function generateMavenSettings(settings) {
    if (process.env['UNIT_TEST'] !== 'true') {
        console.log('Maven: Creating settings.xml file...');
    }

    let settingsTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'maven', 'settings.xml'), 'utf8');
    let settingsFile = Sqrl.render(settingsTemplate, settings);
    let outputPath = settings.filePath || path.join('.m2', 'settings.xml');

    ensureDirectoryExistence(outputPath);
    fs.writeFileSync(outputPath, settingsFile);

    if (process.env['UNIT_TEST'] !== 'true') {
        console.log('Maven: The settings.xml file has been created');
    }
}

function generateNpmSettings(settings) {
    if (process.env['UNIT_TEST'] !== 'true') {
        console.log('Npm: Creating .npmrc file...');
    }

    settings.registry = fixUrl(settings.registry);
    settings.proxy = fixUrl(settings.proxy);
    settings.http_proxy = fixUrl(settings.http_proxy);
    settings.https_proxy = fixUrl(settings.https_proxy);

    let settingsTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'npm', '.npmrc'), 'utf8');
    let settingsFile = Sqrl.render(settingsTemplate, settings);
    let outputPath = settings.filePath || path.join('.npmrc');

    ensureDirectoryExistence(outputPath);
    fs.writeFileSync(outputPath, settingsFile);

    if (process.env['UNIT_TEST'] !== 'true') {
        console.log('Npm: The .npmrc file has been created');
    }
}

function generateSettings() {
    let settings = require('drone-env-parser').parseEnvs();

    if (Object.prototype.hasOwnProperty.call(settings, 'maven')) {
        generateMavenSettings(settings['maven']);
    }

    if (Object.prototype.hasOwnProperty.call(settings, 'npm')) {
        generateNpmSettings(settings['npm']);
    }
}

function fixUrl(urlObj) {
    if (!urlObj) {
        return;
    }
    const parsedUrl = require('url').parse(urlObj.url, true);

    let userpass;
    if (urlObj.username || urlObj.password) {
        userpass = `${urlObj.username}${urlObj.password ? `:${urlObj.password}` : ''}@`;
    }

    return `${parsedUrl.protocol || 'http:'}//${userpass || ''}${parsedUrl.host || ''}${parsedUrl.pathname || ''}${parsedUrl.search || ''}`;
}

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

module.exports = {
    generateSettings
};
