jest.mock('../models/Convite.js', () => ({}));

jest.mock('../models/User.js', () => {
	const User = jest.fn();
	User.findById = jest.fn();
	User.findOne = jest.fn();
	return User;
});

jest.mock('../models/Equipe.js', () => {
	const Equipe = jest.fn();
	Equipe.findById = jest.fn();
	return Equipe;
});

jest.mock('../utils/sendEmail.js', () => jest.fn());

const conviteController = require('../controllers/conviteController');
const User = require('../models/User.js');
const Equipe = require('../models/Equipe.js');
const sendEmail = require('../utils/sendEmail.js');

function makeRes() {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
}

describe('conviteController.convidarMembro', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('retorna 200 e envia convite quando usuário existe e não é membro', async () => {
		User.findById.mockResolvedValue({ _id: 'u1' });
		Equipe.findById.mockResolvedValue({
			_id: 'e1',
			code: '1234',
			membros: [{ user: 'u1', role: 'admin' }],
		});
		User.findOne.mockResolvedValue({ _id: 'u2', email: 'membro@ex.com' });
		sendEmail.mockResolvedValue();

		const req = {
			user: { id: 'u1' },
			params: { equipeId: 'e1' },
			body: { email: 'membro@ex.com' },
		};
		const res = makeRes();

		await conviteController.convidarMembro(req, res);

		expect(sendEmail).toHaveBeenCalledTimes(1);
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ message: 'Convite enviado com sucesso!' });
	});

	test('retorna 400 quando email não é informado', async () => {
		User.findById.mockResolvedValue({ _id: 'u1' });
		Equipe.findById.mockResolvedValue({ _id: 'e1', code: '1234', membros: [] });

		const req = { user: { id: 'u1' }, params: { equipeId: 'e1' }, body: {} };
		const res = makeRes();

		await conviteController.convidarMembro(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ message: 'Email é obrigatório.' });
		expect(sendEmail).not.toHaveBeenCalled();
	});

	test('retorna 400 quando convidado já é membro', async () => {
		User.findById.mockResolvedValue({ _id: 'u1' });
		Equipe.findById.mockResolvedValue({
			_id: 'e1',
			code: '1234',
			membros: [{ user: 'u2', role: 'membro' }],
		});
		User.findOne.mockResolvedValue({ _id: 'u2', email: 'membro@ex.com' });

		const req = {
			user: { id: 'u1' },
			params: { equipeId: 'e1' },
			body: { email: 'membro@ex.com' },
		};
		const res = makeRes();

		await conviteController.convidarMembro(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ message: 'Usuário já é membro da equipe.' });
		expect(sendEmail).not.toHaveBeenCalled();
	});
});

