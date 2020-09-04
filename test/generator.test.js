'use strict';

const {describe, it} = require('mocha');

const path = require('path');
const fs = require('fs');

const assert = require('assert');
const mockedEnv = require('mocked-env');

const {generateSettings} = require('../generator');

let mavenSettingsPath = path.join(__dirname, 'settings.xml');
let npmSettingsPath = path.join(__dirname, '.npmrc');

const minify1 = /\s{2,}|($(\r|\n))/gm;
const minify2 = />\s</gm;

function minify(str) {
    return str.replace(minify1, ' ').replace(minify2, '><');
}

function getSettingsXML(content) {
    return (
        '<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 https://maven.apache.org/xsd/settings-1.0.0.xsd">' +
        content +
        '</settings>'
    );
}

function readSettingsFile(filePath) {
    return minify(fs.readFileSync(filePath, 'utf8'));
}

function deleteSettingsFile(filePath) {
    try {
        fs.unlinkSync(filePath);
    } catch (e) {
        console.error(`Could not delete settings file ${filePath}`);
    }
}

describe('index.js', function () {
    it('should create an empty registry files', function () {
        let restore = mockedEnv({
            UNIT_TEST: 'true',
            PLUGIN_MAVEN: JSON.stringify({
                filePath: mavenSettingsPath
            }),
            PLUGIN_NPM: JSON.stringify({
                filePath: npmSettingsPath
            })
        });
        try {
            require('../index');
            assert.strictEqual(
                readSettingsFile(mavenSettingsPath),
                getSettingsXML('')
            );
            assert.strictEqual(readSettingsFile(npmSettingsPath), '');
        } finally {
            restore();
            deleteSettingsFile(mavenSettingsPath);
            deleteSettingsFile(npmSettingsPath);
        }
    });
});

describe('Maven: generator.js', function () {
    describe('#generateSettings()', function () {
        it('should create an empty settings file', function () {
            let restore = mockedEnv(
                {
                    UNIT_TEST: 'true',
                    PLUGIN_MAVEN: JSON.stringify({
                        filePath: mavenSettingsPath
                    })
                },
                {clear: true}
            );
            try {
                generateSettings();
                assert.strictEqual(
                    readSettingsFile(mavenSettingsPath),
                    getSettingsXML('')
                );
            } finally {
                restore();
                deleteSettingsFile(mavenSettingsPath);
            }
        });
        it('should output something to the console', function () {
            let restore = mockedEnv(
                {
                    PLUGIN_MAVEN: JSON.stringify({
                        filePath: mavenSettingsPath
                    })
                },
                {clear: true}
            );
            let originalLog = console.log;
            let consoleOutput = [];
            console.log = (str) => consoleOutput.push(str);
            try {
                generateSettings();
                assert.strictEqual(
                    readSettingsFile(mavenSettingsPath),
                    getSettingsXML('')
                );
                assert.deepEqual(consoleOutput, [
                    `Maven: Creating ${mavenSettingsPath} file...`,
                    `Maven: The ${mavenSettingsPath} file has been created.`
                ]);
            } finally {
                restore();
                console.log = originalLog;
                deleteSettingsFile(mavenSettingsPath);
            }
        });
        it('should add the local repository declaration', function () {
            let restore = mockedEnv(
                {
                    UNIT_TEST: 'true',
                    PLUGIN_MAVEN: JSON.stringify({
                        filePath: mavenSettingsPath,
                        localrepository: 'https://example.org/'
                    })
                },
                {clear: true}
            );
            try {
                generateSettings();
                assert.strictEqual(
                    readSettingsFile(mavenSettingsPath),
                    getSettingsXML(
                        '<localRepository>https://example.org/</localRepository>'
                    )
                );
            } finally {
                restore();
                deleteSettingsFile(mavenSettingsPath);
            }
        });
        it('should add the server declarations', function () {
            let restore = mockedEnv(
                {
                    UNIT_TEST: 'true',
                    PLUGIN_MAVEN: JSON.stringify({
                        filePath: mavenSettingsPath,
                        servers: [
                            {
                                id: 'sytm-nexus',
                                username: 'md5lukas',
                                password: 'password'
                            },
                            {
                                id: 'sonatype',
                                username: 'sona',
                                password: 'type'
                            }
                        ]
                    })
                },
                {clear: true}
            );
            try {
                generateSettings();
                assert.strictEqual(
                    readSettingsFile(mavenSettingsPath),
                    getSettingsXML(
                        '<servers><server><id>sytm-nexus</id><username>md5lukas</username><password>password</password></server>' +
                        '<server><id>sonatype</id><username>sona</username><password>type</password></server></servers>'
                    )
                );
            } finally {
                restore();
                deleteSettingsFile(mavenSettingsPath);
            }
        });
        it('should add the mirror declarations', function () {
            let restore = mockedEnv(
                {
                    UNIT_TEST: 'true',
                    PLUGIN_MAVEN: JSON.stringify({
                        filePath: mavenSettingsPath,
                        mirrors: [
                            {
                                id: 'central-proxy',
                                name: 'Central Proxy',
                                url: 'https://repo.sytm.de/repository/maven-central/',
                                mirrorOf: 'central'
                            }
                        ]
                    })
                },
                {clear: true}
            );
            try {
                generateSettings();
                assert.strictEqual(
                    readSettingsFile(mavenSettingsPath),
                    getSettingsXML(
                        '<mirrors><mirror><id>central-proxy</id><name>Central Proxy</name><url>https://repo.sytm.de/repository/maven-central/</url><mirrorOf>central</mirrorOf></mirror></mirrors>'
                    )
                );
            } finally {
                restore();
                deleteSettingsFile(mavenSettingsPath);
            }
        });
    });
});

describe('Npm: generator.js', function () {
    describe('#generateSettings()', function () {
        it('should create an empty settings file', function () {
            let restore = mockedEnv(
                {
                    UNIT_TEST: 'true',
                    PLUGIN_NPM: JSON.stringify({
                        filePath: npmSettingsPath
                    })
                },
                {clear: true}
            );
            try {
                generateSettings();
                assert.strictEqual(readSettingsFile(npmSettingsPath), '');
            } finally {
                restore();
                deleteSettingsFile(npmSettingsPath);
            }
        });
        it('should output something to the console', function () {
            let restore = mockedEnv(
                {
                    PLUGIN_NPM: JSON.stringify({
                        filePath: npmSettingsPath
                    })
                },
                {clear: true}
            );
            let originalLog = console.log;
            let consoleOutput = [];
            console.log = (str) => consoleOutput.push(str);
            try {
                generateSettings();
                assert.strictEqual(readSettingsFile(npmSettingsPath), minify(''));
                assert.deepEqual(consoleOutput, [
                    `Npm: Creating ${npmSettingsPath} file...`,
                    `Npm: The ${npmSettingsPath} file has been created.`
                ]);
            } finally {
                restore();
                console.log = originalLog;
                deleteSettingsFile(npmSettingsPath);
            }
        });
        it('should add the registry declarations', function () {
            let restore = mockedEnv(
                {
                    UNIT_TEST: 'true',
                    PLUGIN_NPM: JSON.stringify({
                        filePath: npmSettingsPath,
                        registry: {
                            url: 'http://registry.npmjs.org/',
                            username: 'registry-user',
                            password: 'registry-pass'
                        }
                    })
                },
                {clear: true}
            );
            try {
                generateSettings();
                assert.strictEqual(
                    readSettingsFile(npmSettingsPath),
                    minify(
                        'registry=http://registry-user:registry-pass@registry.npmjs.org/\n'
                    )
                );
            } finally {
                restore();
                deleteSettingsFile(npmSettingsPath);
            }
        });
        it('should add the proxy declarations', function () {
            let restore = mockedEnv(
                {
                    UNIT_TEST: 'true',
                    PLUGIN_NPM: JSON.stringify({
                        filePath: npmSettingsPath,
                        proxy: {
                            url: 'http://example.com/'
                        },
                        https_proxy: {
                            url: 'https://example.com/',
                            username: 'proxy-user',
                            password: 'proxy-pass'
                        }
                    })
                },
                {clear: true}
            );
            try {
                generateSettings();
                assert.strictEqual(
                    readSettingsFile(npmSettingsPath),
                    minify(
                        'proxy=http://example.com/\nhttps_proxy=https://proxy-user:proxy-pass@example.com/\n'
                    )
                );
            } finally {
                restore();
                deleteSettingsFile(npmSettingsPath);
            }
        });
    });
});
