jest.mock('../models/Projeto', () => {
	const Projeto = jest.fn(function (data) {
		Object.assign(this, data);
		this._id = this._id || 'projeto-id';
		this.save = jest.fn().mockResolvedValue(this);
	});

	Projeto.find = jest.fn();
	Projeto.findById = jest.fn();
	Projeto.findByIdAndUpdate = jest.fn();
	Projeto.findByIdAndDelete = jest.fn();
	return Projeto;
});

jest.mock('../models/Equipe', () => {
	const Equipe = jest.fn();
	Equipe.findById = jest.fn();
	Equipe.find = jest.fn();
	return Equipe;
});

jest.mock('../models/User', () => {
	const User = jest.fn();
	User.findById = jest.fn();
	return User;
});

const projetoController = require('../controllers/projetoController');
const Projeto = require('../models/Projeto');
const Equipe = require('../models/Equipe');
const User = require('../models/User');

function makeRes() {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
}

describe('projetoController', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('criarProjeto', () => {
		test('retorna 400 quando campos obrigatórios ausentes', async () => {
			const req = { body: {}, user: { id: 'u1' } };
			const res = makeRes();

			await projetoController.criarProjeto(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Campos obrigatórios ausentes: nome e equipe' });
		});

		test('retorna 403 quando usuário não é admin da equipe', async () => {
			Equipe.findById.mockResolvedValue({ _id: 'e1', membros: [{ user: 'u1', role: 'membro' }] });
			const req = { body: { nome: 'P', equipe: 'e1' }, user: { id: 'u1' } };
			const res = makeRes();

			await projetoController.criarProjeto(req, res);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Acesso restrito a administradores da equipe' });
		});

		test('cria projeto e retorna 201', async () => {
			const equipeDoc = {
				_id: 'e1',
				membros: [{ user: 'u1', role: 'admin' }, { user: 'u2', role: 'membro' }],
				projetos: [],
				save: jest.fn().mockResolvedValue(),
			};
			Equipe.findById.mockResolvedValue(equipeDoc);

			User.findById.mockImplementation(async (id) => ({
				_id: id,
				equipes: [],
				save: jest.fn().mockResolvedValue(),
			}));

			const req = { body: { nome: 'P', descricao: 'D', equipe: 'e1' }, user: { id: 'u1' } };
			const res = makeRes();

			await projetoController.criarProjeto(req, res);

			expect(Projeto).toHaveBeenCalledTimes(1);
			expect(equipeDoc.save).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ nome: 'P', equipe: 'e1' }));
		});
	});

	describe('listarProjetos', () => {
		test('com equipe: retorna 403 quando não é membro', async () => {
			Equipe.findById.mockResolvedValue({ _id: 'e1', membros: [{ user: 'u2' }] });
			const req = { query: { equipe: 'e1' }, user: { id: 'u1' } };
			const res = makeRes();

			await projetoController.listarProjetos(req, res);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Acesso negado: não é membro da equipe' });
		});

		test('sem equipe: lista projetos das equipes do usuário', async () => {
			Equipe.find.mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: 'e1' }, { _id: 'e2' }]) });
			const projetos = [{ _id: 'p1' }];
			const query = { populate: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue(projetos) };
			Projeto.find.mockReturnValue(query);

			const req = { query: {}, user: { id: 'u1' } };
			const res = makeRes();

			await projetoController.listarProjetos(req, res);

			expect(Projeto.find).toHaveBeenCalledWith({ equipe: { $in: ['e1', 'e2'] } });
			expect(res.json).toHaveBeenCalledWith(projetos);
		});
	});

	describe('obterProjeto', () => {
		test('retorna projeto quando usuário é membro', async () => {
			const projetoDoc = { _id: 'p1', equipe: 'e1' };
			Projeto.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(projetoDoc) });
			Equipe.findById.mockResolvedValue({ _id: 'e1', membros: [{ user: 'u1' }] });

			const req = { params: { id: 'p1' }, user: { id: 'u1' } };
			const res = makeRes();

			await projetoController.obterProjeto(req, res);

			expect(res.json).toHaveBeenCalledWith(projetoDoc);
		});
	});

	describe('editarProjeto', () => {
		test('retorna 404 quando projeto não existe', async () => {
			Projeto.findByIdAndUpdate.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
			const req = { params: { id: 'p1' }, body: { nome: 'N' } };
			const res = makeRes();

			await projetoController.editarProjeto(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Projeto não encontrado' });
		});
	});

	test('excluirProjeto remove e retorna msg', async () => {
		Projeto.findByIdAndDelete.mockResolvedValue();
		const req = { params: { id: 'p1' } };
		const res = makeRes();

		await projetoController.excluirProjeto(req, res);

		expect(Projeto.findByIdAndDelete).toHaveBeenCalledWith('p1');
		expect(res.json).toHaveBeenCalledWith({ msg: 'Projeto excluído com sucesso' });
	});
});

