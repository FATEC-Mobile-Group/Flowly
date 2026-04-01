jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('crypto', () => ({ randomBytes: jest.fn() }));
jest.mock('argon2', () => ({ hash: jest.fn(), verify: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));

jest.mock('../utils/sendEmail.js', () => jest.fn());
jest.mock('../utils/validatePassword.js', () => jest.fn());

jest.mock('../models/User', () => {
	const User = jest.fn(function (data) {
		Object.assign(this, data);
		this._id = this._id || 'user-id';
		this.save = jest.fn().mockResolvedValue(this);
	});
	User.findOne = jest.fn();
	User.findById = jest.fn();
	User.updateOne = jest.fn();
	User.find = jest.fn();
	return User;
});

jest.mock('../models/Token.js', () => {
	const Token = jest.fn(function (data) {
		Object.assign(this, data);
		this._id = this._id || 'token-id';
		this.save = jest.fn().mockImplementation(async () => ({ ...this }));
	});
	Token.findOne = jest.fn();
	Token.deleteOne = jest.fn();
	return Token;
});

const authController = require('../controllers/authController');
const crypto = require('crypto');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail.js');
const validatePassword = require('../utils/validatePassword.js');
const User = require('../models/User');
const Token = require('../models/Token.js');

function makeRes() {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	res.send = jest.fn().mockReturnValue(res);
	return res;
}

describe('authController', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.JWT_SECRET = 'test-secret';
		crypto.randomBytes.mockReturnValue(Buffer.from('00112233445566778899aabbccddeeff', 'hex'));
	});

	describe('registrar', () => {
		test('retorna 400 quando senha não passa validação', async () => {
			validatePassword.mockReturnValue('senha fraca');
			const req = { body: { nome: 'A', email: 'a@a.com', genero: 'x', senha: '123' } };
			const res = makeRes();

			await authController.registrar(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ erro: 'senha fraca' });
		});

		test('cria usuário, salva token e envia email (201)', async () => {
			validatePassword.mockReturnValue(true);
			User.findOne.mockResolvedValue(null);
			argon2.hash.mockResolvedValue('hashed');
			sendEmail.mockResolvedValue();

			const req = { body: { nome: 'A', email: 'a@a.com', genero: 'x', senha: 'Senha@123' } };
			const res = makeRes();

			await authController.registrar(req, res);

			expect(User.findOne).toHaveBeenCalledWith({ email: 'a@a.com' });
			expect(Token).toHaveBeenCalledTimes(1);
			expect(sendEmail).toHaveBeenCalledTimes(1);
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.send).toHaveBeenCalledWith({ message: 'Um email foi enviado para verificação.' });
		});
	});

	describe('verificarEmail', () => {
		test('retorna 400 quando usuário inválido', async () => {
			User.findById.mockResolvedValue(null);
			const req = { params: { userId: 'u1', token: 't' } };
			const res = makeRes();

			await authController.verificarEmail(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Usuário inválido' });
		});

		test('marca como verificado quando token válido', async () => {
			User.findById.mockResolvedValue({ _id: 'u1' });
			Token.findOne.mockResolvedValue({ _id: 'tok1', userId: 'u1', token: 't' });
			User.updateOne.mockResolvedValue();
			Token.deleteOne.mockResolvedValue();

			const req = { params: { userId: 'u1', token: 't' } };
			const res = makeRes();

			await authController.verificarEmail(req, res);

			expect(User.updateOne).toHaveBeenCalled();
			expect(Token.deleteOne).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ message: 'Email verificado com sucesso!' });
		});
	});

	test('verificarEmailCodigo confirma com código único', async () => {
		User.findById.mockResolvedValue({ _id: 'u1' });
		Token.findOne.mockResolvedValue({ _id: 'tok1', uniqueCode: 'ABC123' });
		User.updateOne.mockResolvedValue();
		Token.deleteOne.mockResolvedValue();
		const req = { params: { userId: 'u1', uniqueCode: 'ABC123' } };
		const res = makeRes();

		await authController.verificarEmailCodigo(req, res);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ message: 'Email verificado com sucesso!' });
	});

	describe('login', () => {
		test('retorna 404 quando usuário não existe', async () => {
			User.findOne.mockResolvedValue(null);
			const req = { body: { email: 'a@a.com', senha: 'x' } };
			const res = makeRes();

			await authController.login(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Usuário não encontrado' });
		});

		test('retorna token quando login ok', async () => {
			User.findOne.mockResolvedValue({ _id: 'u1', nome: 'A', senha: 'hashed', verificado: true });
			argon2.verify.mockResolvedValue(true);
			jwt.sign.mockReturnValue('jwt-token');

			const req = { body: { email: 'a@a.com', senha: 'Senha@123' } };
			const res = makeRes();

			await authController.login(req, res);

			expect(res.json).toHaveBeenCalledWith({ token: 'jwt-token', user: { id: 'u1', nome: 'A' } });
		});
	});

	describe('listarUsuarios', () => {
		test('retorna 404 quando nenhum usuário encontrado', async () => {
			User.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });
			const req = {};
			const res = makeRes();

			await authController.listarUsuarios(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Nenhum usuário encontrado' });
		});

		test('retorna lista quando existem usuários', async () => {
			const users = [{ nome: 'A', email: 'a@a.com' }];
			User.find.mockReturnValue({ select: jest.fn().mockResolvedValue(users) });
			const req = {};
			const res = makeRes();

			await authController.listarUsuarios(req, res);

			expect(res.json).toHaveBeenCalledWith(users);
		});
	});

	describe('me', () => {
		test('retorna 401 quando não autenticado', async () => {
			const req = {};
			const res = makeRes();

			await authController.me(req, res);

			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Não autenticado' });
		});

		test('retorna dados do usuário autenticado', async () => {
			User.findById.mockReturnValue({
				select: jest.fn().mockResolvedValue({ _id: 'u1', nome: 'A', email: 'a@a.com' }),
			});

			const req = { user: { id: 'u1' } };
			const res = makeRes();

			await authController.me(req, res);

			expect(res.json).toHaveBeenCalledWith({ id: 'u1', nome: 'A', email: 'a@a.com' });
		});
	});

	describe('alterarSenha', () => {
		test('altera senha quando válido (200)', async () => {
			validatePassword.mockReturnValue(true);
			const userDoc = { _id: 'u1', save: jest.fn().mockResolvedValue() };
			User.findById.mockResolvedValue(userDoc);
			argon2.hash.mockResolvedValue('new-hash');

			const req = { user: { id: 'u1' }, body: { novaSenha: 'Senha@123', confirmarSenha: 'Senha@123' } };
			const res = makeRes();

			await authController.alterarSenha(req, res);

			expect(userDoc.senha).toBe('new-hash');
			expect(userDoc.save).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ message: 'Senha alterada com sucesso.' });
		});
	});

	describe('verificarEmailCodigoPost', () => {
		test('retorna 400 quando faltam campos', async () => {
			const req = { body: { email: 'a@a.com' } };
			const res = makeRes();

			await authController.verificarEmailCodigoPost(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Informe email e código.' });
		});

		test('verifica quando código válido (200)', async () => {
			User.findOne.mockResolvedValue({ _id: 'u1' });
			Token.findOne.mockResolvedValue({ _id: 'tok1' });
			User.updateOne.mockResolvedValue();
			Token.deleteOne.mockResolvedValue();

			const req = { body: { email: 'a@a.com', codigo: 'ABC123' } };
			const res = makeRes();

			await authController.verificarEmailCodigoPost(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ message: 'Email verificado com sucesso!' });
		});
	});

	describe('reenviarCodigo', () => {
		test('retorna 400 quando email não informado', async () => {
			const req = { body: {} };
			const res = makeRes();

			await authController.reenviarCodigo(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Informe o email.' });
		});

		test('cria novo token quando não existe e envia email (200)', async () => {
			User.findOne.mockResolvedValue({ _id: 'u1', email: 'a@a.com', verificado: false });
			Token.findOne.mockResolvedValue(null);
			sendEmail.mockResolvedValue();

			const req = { body: { email: 'a@a.com' } };
			const res = makeRes();

			await authController.reenviarCodigo(req, res);

			expect(Token).toHaveBeenCalledTimes(1);
			expect(sendEmail).toHaveBeenCalledTimes(1);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ message: 'Código reenviado com sucesso.' });
		});
	});
});
