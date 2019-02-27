/**
 * Corrector para la práctica de sql
 */

// IMPORTS
const should = require('chai').should();
const path = require('path');
const fs = require('fs-extra');
const Utils = require('./utils');
const to = require('./to');
const child_process = require("child_process");
const spawn = require("child_process").spawn;
const Telnet = require('telnet-client');
const path_assignment = path.resolve(path.join(__dirname, "../"));

// CRITICAL ERRORS
let error_critical = null;

// CONSTANTS
const T_WAIT = 2; // Time between commands
const T_TEST = 2 * 60; // Time between tests (seconds)
const telnet = new Telnet();
const host = "127.0.0.1";
const port = 3030;

// HELPERS
const timeout = ms => new Promise(res => setTimeout(res, ms));

//TESTS
describe("CORE19-05_quiz_socket", function () {

    this.timeout(T_TEST * 1000);

    it('', async function () {
        this.name = `1(Precheck): Checking that the assignment directory exists...`;
        this.score = 0;
        this.msg_ok = `Found the directory '${path_assignment}'`;
        this.msg_err = `Couldn't find the directory '${path_assignment}'`;
        const [error_path, path_ok] = await to(fs.pathExists(path_assignment));
        if (error_path) {
            error_critical = this.msg_err;
        }
        path_ok.should.be.equal(true);
    });

    it('', async function () {
        this.name = `2(Precheck): Installing dependencies...`;
        this.score = 0;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            this.msg_ok = "Dependencies installed successfully";
            this.msg_err = "Error installing dependencies";

            // check that package.json exists
            const path_json = path.join(path_assignment, 'package.json');
            const [json_nok, json_ok] = await to(fs.pathExists(path_json));
            if (json_nok || !json_ok) {
                this.msg_err = `The file '${path_json}' has not been found`;
                error_critical = this.msg_err;
            }
            json_ok.should.be.equal(true);

            // check package.json format
            const [error_json, contenido] = await to(fs.readFile(path_json, 'utf8'));
            if (error_json) {
                this.msg_err = `The file '${path_json}' doesn't have the right format`;
                error_critical = this.msg_err;
            }
            should.not.exist(error_json);
            const is_json = Utils.isJSON(contenido);
            if (!is_json) {
                error_critical = this.msg_err;
            }
            is_json.should.be.equal(true);

            // run npm install
            let error_deps;
            try {
                child_process.execSync("npm install", {cwd: path_assignment}).toString();
            } catch (error_deps) {
                this.msg_err = "Error running 'npm install': " + error_deps;
                error_critical = this.msg_err;
                console.log(error_deps);
            }
            should.not.exist(error_deps);

            // inject local figlet
            try {
                const figdata = "module.exports.textSync = function(text){return text};";
                fs.removeSync(path.join(path_assignment, 'node_modules', 'figlet'));
                fs.mkdirSync(path.join(path_assignment, 'node_modules', 'figlet'));
                fs.writeFileSync(path.join(path_assignment, 'node_modules', 'figlet', 'index.js'), figdata, {
                    encoding: 'utf8',
                    flag: 'w'
                });
            } catch (error) {
                debug("Error wrapping figlet");
            }

            // replace answers file
            [error_deps, path_ok] = await to(fs.move(path.join(path_assignment, 'quizzes.sqlite'), path.join(path_assignment, 'quizzes.original.sqlite'), {"overwrite": true}));
            [error_deps, path_ok] = await to(fs.move(path.join(path_assignment, 'tests', 'quizzes.sqlite'), path.join(path_assignment, 'quizzes.sqlite'), {"overwrite": true}));
            if (error_deps) {
                this.msg_err = "Error copying the answers file : " + error_deps;
                error_critical = this.msg_err;
            }
            should.not.exist(error_deps);

        }
    });


    it('', async function () {
        this.name = `3: Checking that the file 'quizzes.sqlite' is read. Running 'list'...`;
        this.score = 1;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            const input = ["list"];
            const expected = "Answer Number 1";
            let error = "";
            this.msg_ok = `Found '${expected}' in ${path_assignment}`;
            const client = spawn("node", ["main.js"], {cwd: path_assignment});
            client.on('error', function (data) {
                error += data
            });
            await timeout(T_WAIT * 1000);
            this.msg_err = `Couldn't connect to ${host}:${port}`;
            await telnet.connect({host: host, port: port, timeout: 1500});
            [error_telnet, output] = await to(telnet.exec(input[0] + "\n"));
            error += error_telnet;
            await telnet.disconnect();
            if (client) {
                client.kill();
                await timeout(T_WAIT * 1000);
            }
            this.msg_err = `Couldn't find '${expected}' in ${path_assignment}\nError:${error}\nReceived:${output}`;
            Utils.search(expected, output).should.be.equal(true);
        }
    });

    it('', async function () {
        this.name = `4: Checking that invalid input parameters are detected. Running 'test'...`;
        this.score = 1;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            const input = ["test"];
            const expected = /error/img;
            let error = "";
            this.msg_ok = `Found '${expected}' in ${path_assignment}`;
            const client = spawn("node", ["main.js"], {cwd: path_assignment});
            client.on('error', function (data) {
                error += data
            });
            await timeout(T_WAIT * 1000);
            this.msg_err = `Couldn't connect to ${host}:${port}`;
            await telnet.connect({host: host, port: port, timeout: 1500});
            [error_telnet, output] = await to(telnet.exec(input[0] + "\n"));
            await timeout(T_WAIT * 1000);
            error += error_telnet;
            await telnet.disconnect();
            if (client) {
                client.kill();
            }
            this.msg_err = `Couldn't find '${expected}' in ${path_assignment}\nError:${error}\nReceived:${output}`;
            Utils.search(expected, output).should.be.equal(true);
        }
    });

    it('', async function () {
        this.name = `5: Checking that right answers are detected. Running 'test 1'...`;
        this.score = 1;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            const input = ["test 1", "OK"];
            const expected = /\bcorrect/img;
            let error = "";
            this.msg_ok = `Found '${expected}' in ${path_assignment}`;
            const client = spawn("node", ["main.js"], {cwd: path_assignment});
            client.on('error', function (data) {
                error += data
            });
            await timeout(T_WAIT * 1000);
            this.msg_err = `Couldn't connect to ${host}:${port}`;
            await telnet.connect({host: host, port: port, timeout: 1500});
            [error_telnet, output] = await to(telnet.exec(input[0] + "\n"));
            await timeout(T_WAIT * 1000);
            [error_telnet, output] = await to(telnet.exec(input[1] + "\n"));
            await timeout(T_WAIT * 1000);
            error += error_telnet;
            await telnet.disconnect();
            if (client) {
                client.kill();
            }
            this.msg_err = `Couldn't find '${expected}' in ${path_assignment}\nError:${error}\nReceived:${output}`;
            Utils.search(expected, output).should.be.equal(true);
        }
    });

    it('', async function () {
        this.name = `6: Checking that wrong answers are detected. Running 'test 1'...`;
        this.score = 1;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            const input = ["test 1", "NOK"];
            const expected = /incorrect/img;
            let error = "";
            this.msg_ok = `Found '${expected}' in ${path_assignment}`;
            const client = spawn("node", ["main.js"], {cwd: path_assignment});
            client.on('error', function (data) {
                error += data
            });
            await timeout(T_WAIT * 1000);
            this.msg_err = `Couldn't connect to ${host}:${port}`;
            await telnet.connect({host: host, port: port, timeout: 1500});
            [error_telnet, output] = await to(telnet.exec(input[0] + "\n"));
            await timeout(T_WAIT * 1000);
            [error_telnet, output] = await to(telnet.exec(input[1] + "\n"));
            await timeout(T_WAIT * 1000);
            error += error_telnet;
            await telnet.disconnect();
            if (client) {
                client.kill();
            }
            this.msg_err = `Couldn't find '${expected}' in ${path_assignment}\nError:${error}\nReceived:${output}`;
            Utils.search(expected, output).should.be.equal(true);
        }
    });

    it('', async function () {
        this.name = `7: Checking that right answers are detected. Running 'play'...`;
        this.score = 1.5;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            const input = ["play", "OK"];
            const expected = /correct/img;
            let error = "";
            this.msg_ok = `Found '${expected}' in ${path_assignment}`;
            const client = spawn("node", ["main.js"], {cwd: path_assignment});
            client.on('error', function (data) {
                error += data
            });
            await timeout(T_WAIT * 1000);
            this.msg_err = `Couldn't connect to ${host}:${port}`;
            await telnet.connect({host: host, port: port, timeout: 1500});
            [error_telnet, output] = await to(telnet.exec(input[0] + "\n"));
            await timeout(T_WAIT * 1000);
            [error_telnet, output] = await to(telnet.exec(input[1] + "\n"));
            await timeout(T_WAIT * 1000);
            error += error_telnet;
            await telnet.disconnect();
            if (client) {
                client.kill();
            }
            this.msg_err = `Couldn't find '${expected}' in ${path_assignment}\nError:${error}\nReceived:${output}`;
            Utils.search(expected, output).should.be.equal(true);
        }
    });

    it('', async function () {
        this.name = `8: Checking that answers are correctly scored. Running 'play'...`;
        this.score = 1.5;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            const input = ["play", "OK"];
            const expected = "/1/";
            let error = "";
            this.msg_ok = `Found '${expected}' in ${path_assignment}`;
            const client = spawn("node", ["main.js"], {cwd: path_assignment});
            client.on('error', function (data) {
                error += data
            });
            await timeout(T_WAIT * 1000);
            this.msg_err = `Couldn't connect to ${host}:${port}`;
            await telnet.connect({host: host, port: port, timeout: 1500});
            [error_telnet, output] = await to(telnet.exec(input[0] + "\n"));
            await timeout(T_WAIT * 1000);
            [error_telnet, output] = await to(telnet.exec(input[1] + "\n"));
            await timeout(T_WAIT * 1000);
            error += error_telnet;
            await telnet.disconnect();
            if (client) {
                client.kill();
            }
            this.msg_err = `Couldn't find '${expected}' in ${path_assignment}\nError:${error}\nReceived:${output}`;
            Utils.search(expected, output).should.be.equal(true);
        }
    });

    it('', async function () {
        this.name = `9: Checking that wrong answers are detected. Running 'play'...`;
        this.score = 1.5;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            const input = ["play", "NOK"];
            const expected = /incorrect/img;
            let error = "";
            this.msg_ok = `Found '${expected}' in ${path_assignment}`;
            const client = spawn("node", ["main.js"], {cwd: path_assignment});
            client.on('error', function (data) {
                error += data
            });
            await timeout(T_WAIT * 1000);
            this.msg_err = `Couldn't connect to ${host}:${port}`;
            await telnet.connect({host: host, port: port, timeout: 1500});
            [error_telnet, output] = await to(telnet.exec(input[0] + "\n"));
            await timeout(T_WAIT * 1000);
            [error_telnet, output] = await to(telnet.exec(input[1] + "\n"));
            await timeout(T_WAIT * 1000);
            error += error_telnet;
            await telnet.disconnect();
            if (client) {
                client.kill();
            }
            this.msg_err = `Couldn't find '${expected}' in ${path_assignment}\nError:${error}\nReceived:${output}`;
            Utils.search(expected, output).should.be.equal(true);
        }
    });

    it('', async function () {
        this.name = `10: Checking that the wrong answer ends the game. Running 'play'...`;
        this.score = 1.5;
        if (error_critical) {
            this.msg_err = error_critical;
            should.not.exist(error_critical);
        } else {
            const input = ["play", "NOK"];
            const expected = "fin";
            let error = "";
            this.msg_ok = `Found '${expected}' in ${path_assignment}`;
            const client = spawn("node", ["main.js"], {cwd: path_assignment});
            client.on('error', function (data) {
                error += data
            });
            await timeout(T_WAIT * 1000);
            this.msg_err = `Couldn't connect to ${host}:${port}`;
            await telnet.connect({host: host, port: port, timeout: 1500});
            [error_telnet, output] = await to(telnet.exec(input[0] + "\n"));
            await timeout(T_WAIT * 1000);
            [error_telnet, output] = await to(telnet.exec(input[1] + "\n"));
            await timeout(T_WAIT * 1000);
            error += error_telnet;
            await telnet.disconnect();
            if (client) {
                client.kill();
            }
            this.msg_err = `Couldn't find '${expected}' in ${path_assignment}\nError:${error}\nReceived:${output}`;
            Utils.search(expected, output).should.be.equal(true);
        }
    });
    after("Restoring the original file", async function () {
        [error_copy, path_ok] = await to(fs.move(path.join(path_assignment, 'quizzes.original.sqlite'), path.join(path_assignment, 'quizzes.sqlite')));
    });
});