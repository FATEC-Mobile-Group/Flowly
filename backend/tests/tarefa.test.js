jest.mock('../models/Tarefa', () => {
	const Tarefa = jest.fn(function (data) {
		Object.assign(this, data);
		this._id = this._id || 'tarefa-id';
		this.save = jest.fn().mockResolvedValue(this);
	});

	Tarefa.find = jest.fn();
	Tarefa.findById = jest.fn();
	Tarefa.findByIdAndUpdate = jest.fn();
	Tarefa.findByIdAndDelete = jest.fn();
	return Tarefa;
});

jest.mock('../models/User', () => {
	const User = jest.fn();
	User.findById = jest.fn();
	return User;
});

jest.mock('../models/Projeto', () => {
	const Projeto = jest.fn();
	Projeto.findById = jest.fn();
	return Projeto;
});

jest.mock('../models/Equipe', () => {
	const Equipe = jest.fn();
	Equipe.findById = jest.fn();
	return Equipe;
});

const tarefaController = require('../controllers/tarefaController');
const Tarefa = require('../models/Tarefa');
const User = require('../models/User');
const Projeto = require('../models/Projeto');
const Equipe = require('../models/Equipe');

function makeRes() {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
}

describe('tarefaController', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('criarTarefa', () => {
		test('retorna 400 quando campos obrigatórios ausentes', async () => {
			const req = { body: {}, user: { id: 'u1' } };
			const res = makeRes();

			await tarefaController.criarTarefa(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Campos obrigatórios ausentes: nome, prazo e projeto' });
		});

		test('cria tarefa quando admin da equipe e retorna 201', async () => {
			User.findById.mockResolvedValue({ _id: 'u2' });
			Projeto.findById.mockResolvedValue({ _id: 'p1', equipe: 'e1' });
			Equipe.findById.mockResolvedValue({
				_id: 'e1',
				membros: [{ user: 'u1', role: 'admin' }],
			});

			const req = {
				user: { id: 'u1' },
				body: {
					nome: 'T1',
					prazo: '2026-04-30',
					projeto: 'p1',
					associado: 'u2',
					visivelAtodos: true,
				},
			};
			const res = makeRes();

			await tarefaController.criarTarefa(req, res);

			expect(Tarefa).toHaveBeenCalledTimes(1);
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ nome: 'T1', projeto: 'p1' }));
		});
	});

	test('listarTarefas retorna 200 com tarefas públicas', async () => {
		const tarefas = [{ _id: 't1' }];
		Tarefa.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(tarefas) });
		const req = {};
		const res = makeRes();

		await tarefaController.listarTarefas(req, res);

		expect(Tarefa.find).toHaveBeenCalledWith({ visivelAtodos: true });
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(tarefas);
	});

	test('listarTarefasPrivadas retorna 200 com tarefas privadas', async () => {
		const tarefas = [{ _id: 't2' }];
		Tarefa.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(tarefas) });
		const req = {};
		const res = makeRes();

		await tarefaController.listarTarefasPrivadas(req, res);

		expect(Tarefa.find).toHaveBeenCalledWith({ visivelAtodos: false });
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(tarefas);
	});

	describe('editarTarefa', () => {
		test('retorna 404 quando tarefa não encontrada', async () => {
			Tarefa.findById.mockResolvedValue(null);
			const req = { params: { id: 't1' }, body: { nome: 'N' } };
			const res = makeRes();

			await tarefaController.editarTarefa(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Tarefa não encontrada' });
		});

		test('retorna 200 quando atualiza com sucesso', async () => {
			Tarefa.findById.mockResolvedValue({ _id: 't1' });
			Tarefa.findByIdAndUpdate.mockResolvedValue({ _id: 't1', nome: 'N' });
			const req = { params: { id: 't1' }, body: { nome: 'N' } };
			const res = makeRes();

			await tarefaController.editarTarefa(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Tarefa atualizada com sucesso',
				tarefaAtualizada: { _id: 't1', nome: 'N' },
			});
		});
	});

	test('excluirTarefa remove e retorna msg', async () => {
		Tarefa.findByIdAndDelete.mockResolvedValue();
		const req = { params: { id: 't1' } };
		const res = makeRes();

		await tarefaController.excluirTarefa(req, res);

		expect(Tarefa.findByIdAndDelete).toHaveBeenCalledWith('t1');
		expect(res.json).toHaveBeenCalledWith({ msg: 'Tarefa excluída' });
	});

	test('listarMinhasTarefas retorna tarefas do usuário', async () => {
		const tarefas = [{ _id: 't1' }];
		Tarefa.find.mockReturnValue({ populate: jest.fn().mockResolvedValue(tarefas) });
		const req = { user: { id: 'u1' } };
		const res = makeRes();

		await tarefaController.listarMinhasTarefas(req, res);

		expect(Tarefa.find).toHaveBeenCalledWith({ associado: 'u1' });
		expect(res.json).toHaveBeenCalledWith(tarefas);
	});

	describe('associarTarefa', () => {
		test('retorna 404 quando tarefa não encontrada', async () => {
			Tarefa.findById.mockResolvedValue(null);
			const req = { params: { id: 't1' }, user: { id: 'u1' } };
			const res = makeRes();

			await tarefaController.associarTarefa(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Tarefa não encontrada' });
		});

		test('associa tarefa ao usuário quando membro da equipe', async () => {
			const tarefaDoc = { _id: 't1', projeto: 'p1', save: jest.fn().mockResolvedValue() };
			Tarefa.findById.mockResolvedValue(tarefaDoc);
			Projeto.findById.mockResolvedValue({ _id: 'p1', equipe: 'e1' });
			Equipe.findById.mockResolvedValue({ _id: 'e1', membros: [{ user: 'u1' }] });

			const req = { params: { id: 't1' }, user: { id: 'u1' } };
			const res = makeRes();

			await tarefaController.associarTarefa(req, res);

			expect(tarefaDoc.associado).toBe('u1');
			expect(tarefaDoc.status).toBe('em_andamento');
			expect(tarefaDoc.save).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ message: 'Tarefa associada com sucesso', tarefa: tarefaDoc });
		});
	});

	test('desassociarTarefa remove associado e retorna 200', async () => {
		const tarefaDoc = { _id: 't1', projeto: 'p1', save: jest.fn().mockResolvedValue() };
		Tarefa.findById.mockResolvedValue(tarefaDoc);
		Projeto.findById.mockResolvedValue({ _id: 'p1', equipe: 'e1' });
		Equipe.findById.mockResolvedValue({ _id: 'e1', membros: [{ user: 'u1' }] });

		const req = { params: { id: 't1' }, user: { id: 'u1' } };
		const res = makeRes();

		await tarefaController.desassociarTarefa(req, res);

		expect(tarefaDoc.associado).toBe(null);
		expect(tarefaDoc.status).toBe('pendente');
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ message: 'Tarefa desassociada com sucesso', tarefa: tarefaDoc });
	});

	describe('concluirTarefa', () => {
		test('retorna 403 quando usuário não é o associado', async () => {
			const tarefaDoc = { _id: 't1', associado: 'u2' };
			Tarefa.findById.mockResolvedValue(tarefaDoc);
			const req = { params: { id: 't1' }, user: { id: 'u1' } };
			const res = makeRes();

			await tarefaController.concluirTarefa(req, res);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({ erro: 'Somente o usuário associado pode concluir a tarefa' });
		});

		test('conclui tarefa quando associado e membro', async () => {
			const tarefaDoc = { _id: 't1', associado: 'u1', projeto: 'p1', save: jest.fn().mockResolvedValue() };
			Tarefa.findById.mockResolvedValue(tarefaDoc);
			Projeto.findById.mockResolvedValue({ _id: 'p1', equipe: 'e1' });
			Equipe.findById.mockResolvedValue({ _id: 'e1', membros: [{ user: 'u1' }] });

			const req = { params: { id: 't1' }, user: { id: 'u1' } };
			const res = makeRes();

			await tarefaController.concluirTarefa(req, res);

			expect(tarefaDoc.status).toBe('concluido');
			expect(tarefaDoc.save).toHaveBeenCalled();
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ message: 'Tarefa concluída com sucesso', tarefa: tarefaDoc });
		});
	});
});

