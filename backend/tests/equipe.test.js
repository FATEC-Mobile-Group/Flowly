jest.mock('../models/Equipe', () => {
	const Equipe = jest.fn(function (data) {
		Object.assign(this, data);
		this._id = this._id || 'equipe-id';
		this.membros = this.membros || [];
		this.save = jest.fn().mockResolvedValue(this);
	});

	Equipe.findOne = jest.fn();
	Equipe.findById = jest.fn();
	Equipe.find = jest.fn();
	Equipe.findByIdAndUpdate = jest.fn();
	Equipe.findByIdAndDelete = jest.fn();
	Equipe.exists = jest.fn();
	return Equipe;
});

jest.mock('../models/User', () => {
	const User = jest.fn();
	User.findById = jest.fn();
	User.find = jest.fn();
	return User;
});

const equipeController = require('../controllers/equipeController');
const Equipe = require('../models/Equipe');
const User = require('../models/User');

function makeRes() {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
}

describe('equipeController', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('criarEquipe', () => {
		test('cria equipe e retorna 201 com equipe populada', async () => {
			const userDoc = { _id: 'u1', equipes: [], save: jest.fn().mockResolvedValue() };
			User.findById.mockResolvedValue(userDoc);

			// Código único: findOne().lean() -> null (não existe)
			Equipe.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

			const equipePopulada = { _id: 'e1', nome: 'Time', membros: [{ nome: 'A', email: 'a@a.com' }] };
			Equipe.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(equipePopulada) });

			const randSpy = jest.spyOn(Math, 'random').mockReturnValue(0.1234);

			const req = {
				user: { id: 'u1' },
				body: { nome: 'Time', descricao: 'Desc', vinculoEmpresarial: false, membros: [] },
			};
			const res = makeRes();

			await equipeController.criarEquipe(req, res);

			expect(Equipe).toHaveBeenCalledTimes(1);
			expect(userDoc.save).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(equipePopulada);

			randSpy.mockRestore();
		});

		test('retorna 400 quando nome é vazio', async () => {
			User.findById.mockResolvedValue({ _id: 'u1' });
			const req = { user: { id: 'u1' }, body: { nome: '   ' } };
			const res = makeRes();

			await equipeController.criarEquipe(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ erro: 'O nome da equipe é obrigatório' });
		});
	});

	test('listarEquipes retorna equipes do usuário', async () => {
		const equipes = [{ _id: 'e1' }];
		Equipe.find.mockReturnValue({ populate: jest.fn().mockResolvedValue(equipes) });
		const req = { user: { id: 'u1' } };
		const res = makeRes();

		await equipeController.listarEquipes(req, res);

		expect(Equipe.find).toHaveBeenCalledWith({ 'membros.user': 'u1' });
		expect(res.json).toHaveBeenCalledWith(equipes);
	});

	describe('obterEquipe', () => {
		test('retorna equipe quando usuário é membro', async () => {
			const equipeDoc = { _id: 'e1', membros: [{ user: 'u1' }] };
			Equipe.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(equipeDoc) });
			const req = { user: { id: 'u1' }, params: { id: 'e1' } };
			const res = makeRes();

			await equipeController.obterEquipe(req, res);

			expect(res.json).toHaveBeenCalledWith(equipeDoc);
		});

		test('retorna 403 quando usuário não é membro', async () => {
			const equipeDoc = { _id: 'e1', membros: [{ user: 'u2' }] };
			Equipe.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(equipeDoc) });
			const req = { user: { id: 'u1' }, params: { id: 'e1' } };
			const res = makeRes();

			await equipeController.obterEquipe(req, res);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Acesso negado: não é membro da equipe' });
		});
	});

	describe('editarEquipe', () => {
		test('edita e retorna equipe atualizada', async () => {
			const updated = { _id: 'e1', nome: 'Novo' };
			Equipe.findByIdAndUpdate.mockReturnValue({ populate: jest.fn().mockResolvedValue(updated) });
			const req = { params: { id: 'e1' }, body: { nome: 'Novo' } };
			const res = makeRes();

			await equipeController.editarEquipe(req, res);

			expect(res.json).toHaveBeenCalledWith(updated);
		});

		test('retorna 404 quando equipe não existe', async () => {
			Equipe.findByIdAndUpdate.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
			const req = { params: { id: 'e1' }, body: { nome: 'Novo' } };
			const res = makeRes();

			await equipeController.editarEquipe(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Equipe não encontrada' });
		});
	});

	test('excluirEquipe remove equipe e retorna msg', async () => {
		Equipe.findByIdAndDelete.mockResolvedValue();
		const req = { params: { id: 'e1' } };
		const res = makeRes();

		await equipeController.excluirEquipe(req, res);

		expect(Equipe.findByIdAndDelete).toHaveBeenCalledWith('e1');
		expect(res.json).toHaveBeenCalledWith({ msg: 'Equipe excluída com sucesso' });
	});

	describe('obterMembrosEquipe', () => {
		test('retorna membros (nome/email) quando usuário pertence', async () => {
			Equipe.exists.mockResolvedValue(true);
			Equipe.findById.mockReturnValue({
				lean: jest.fn().mockResolvedValue({ _id: 'e1', membros: [{ user: 'u1' }, { user: 'u2' }] }),
			});
			User.find.mockReturnValue({
				select: jest.fn().mockReturnValue({
					lean: jest.fn().mockResolvedValue([
						{ _id: 'u1', nome: 'A', email: 'a@a.com' },
						{ _id: 'u2', nome: 'B', email: 'b@b.com' },
					]),
				}),
			});

			const req = { user: { id: 'u1' }, params: { id: 'e1' } };
			const res = makeRes();

			await equipeController.obterMembrosEquipe(req, res);

			expect(res.json).toHaveBeenCalledWith([
				{ nome: 'A', email: 'a@a.com' },
				{ nome: 'B', email: 'b@b.com' },
			]);
		});

		test('retorna 403 quando usuário não pertence', async () => {
			Equipe.exists.mockResolvedValue(false);
			Equipe.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'e1', membros: [] }) });

			const req = { user: { id: 'u1' }, params: { id: 'e1' } };
			const res = makeRes();

			await equipeController.obterMembrosEquipe(req, res);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Acesso negado: não é membro da equipe' });
		});
	});

	describe('obterEquipePorCodigo', () => {
		test('retorna 400 quando código é inválido', async () => {
			const req = { query: { code: '12' } };
			const res = makeRes();

			await equipeController.obterEquipePorCodigo(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Código inválido' });
		});

		test('retorna 404 quando equipe não encontrada', async () => {
			Equipe.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
			const req = { query: { code: '1234' } };
			const res = makeRes();

			await equipeController.obterEquipePorCodigo(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Equipe não encontrada' });
		});

		test('retorna equipe quando encontrada', async () => {
			const equipeDoc = { _id: 'e1', code: '1234' }; 
			Equipe.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(equipeDoc) });
			const req = { query: { code: '1234' } };
			const res = makeRes();

			await equipeController.obterEquipePorCodigo(req, res);

			expect(res.json).toHaveBeenCalledWith(equipeDoc);
		});
	});

	describe('entrarNaEquipe', () => {
		test('retorna 200 e adiciona membro quando não era membro', async () => {
			const equipeDoc = { _id: 'e1', membros: [{ user: 'u2' }], save: jest.fn().mockResolvedValue() };
			Equipe.findById.mockResolvedValue(equipeDoc);
			const req = { user: { id: 'u1' }, params: { id: 'e1' } };
			const res = makeRes();

			await equipeController.entrarNaEquipe(req, res);

			expect(equipeDoc.membros).toEqual(
				expect.arrayContaining([expect.objectContaining({ user: 'u1', role: 'membro' })])
			);
			expect(equipeDoc.save).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ message: 'Entrada na equipe realizada com sucesso' });
		});

		test('retorna 409 quando já é membro', async () => {
			const equipeDoc = { _id: 'e1', membros: [{ user: 'u1' }], save: jest.fn() };
			Equipe.findById.mockResolvedValue(equipeDoc);
			const req = { user: { id: 'u1' }, params: { id: 'e1' } };
			const res = makeRes();

			await equipeController.entrarNaEquipe(req, res);

			expect(res.status).toHaveBeenCalledWith(409);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Usuário já é membro da equipe' });
		});
	});
});

