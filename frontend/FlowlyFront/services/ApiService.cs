using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.Maui.Storage;

namespace FlowlyFront.services
{
    public class ApiService
    {
        private readonly HttpClient _httpClient;

        public ApiService()
        {
            _httpClient = new HttpClient
            {
                BaseAddress = new Uri("http://localhost:5000")

            };
        }

        private async Task AddAuthHeaderAsync()
        {
            var token = await SecureStorage.GetAsync("jwt_token");
            if (!string.IsNullOrEmpty(token))
            {
                // Remove o header anterior se existir
                _httpClient.DefaultRequestHeaders.Remove("Authorization");
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new AuthenticationHeaderValue("Bearer", token);
            }
        }

        public async Task<(bool success, string mensagem, string token, string nome)>
            LoginAsync(string email, string senha)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("/api/auth/login", new { email, senha });

                if (!response.IsSuccessStatusCode)
                {
                    string errorMsg;
                    try
                    {
                        var errObj = await response.Content.ReadFromJsonAsync<Dictionary<string, string>>();
                        errorMsg = errObj != null && errObj.TryGetValue("erro", out var val) ? val : await response.Content.ReadAsStringAsync();
                    }
                    catch
                    {
                        errorMsg = await response.Content.ReadAsStringAsync();
                    }
                    return (false, errorMsg, null, null);
                }

                var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
                return (true, "Login realizado com sucesso!", result.token, result.user.nome);
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conex�o: {ex.Message}", null, null);
            }
        }

        public async Task<(bool success, string mensagem)> RegisterAsync(string nome, string email, string senha)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("/api/auth/registrar", new { nome, email, senha });

                if (response.IsSuccessStatusCode)
                {
                    return (true, "Usuário registrado com sucesso!");
                }
                else
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Erro ao registrar: {errorMsg}");
                }
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}");
            }
        }
        public async Task<(bool success, string mensagem)> VerificarCodigo(string codigo)
        {
            try
            {
                var email = await SecureStorage.GetAsync("user_email");
                var payload = new { email = email ?? string.Empty, codigo };
                var response = await _httpClient.PostAsJsonAsync("/api/auth/verify-code", payload);

                if (response.IsSuccessStatusCode)
                {
                    return (true, "Usuário verificado com sucesso!");
                }
                else
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Erro ao verificar: {errorMsg}");
                }
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}");
            }
        }

        public async Task<(bool success, string mensagem)> ReenviarCodigoAsync()
        {
            try
            {
                var email = await SecureStorage.GetAsync("user_email");
                var response = await _httpClient.PostAsJsonAsync("/api/auth/resend-code", new { email = email ?? string.Empty });
                if (response.IsSuccessStatusCode)
                {
                    return (true, "Código reenviado para seu email.");
                }
                var errorMsg = await response.Content.ReadAsStringAsync();
                return (false, $"Erro ao reenviar código: {errorMsg}");
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}");
            }
        }

        private class LoginResponse
        {
            public string token { get; set; }
            public User user { get; set; }
        }

        private class User
        {
            public string id { get; set; }
            public string nome { get; set; }
        }

        // Métodos para Equipes
        public async Task<(bool success, string mensagem, List<Equipe> equipes)> ListarEquipesAsync()
        {
            try
            {
                await AddAuthHeaderAsync();
                var response = await _httpClient.GetAsync("/api/equipes");

                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Erro ao listar equipes: {errorMsg}", null);
                }

                var equipes = await response.Content.ReadFromJsonAsync<List<Equipe>>();
                return (true, "Equipes listadas com sucesso!", equipes);
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}", null);
            }
        }

        public async Task<(bool success, string mensagem, Equipe equipe)> CriarEquipeAsync(string nome, string descricao = null, string vinculoEmpresarial = null)
        {
            try
            {
                await AddAuthHeaderAsync();
                var random = new Random();
                var code = random.Next(1000, 9999).ToString();
                var response = await _httpClient.PostAsJsonAsync("/api/equipes", new 
                { 
                    nome, 
                    descricao, 
                    vinculoEmpresarial,
                    code
                });

                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Erro ao criar equipe: {errorMsg}", null);
                }

                var equipe = await response.Content.ReadFromJsonAsync<Equipe>();
                return (true, "Equipe criada com sucesso!", equipe);
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}", null);
            }
        }

        public async Task<(bool success, string mensagem, Equipe equipe)> ObterEquipeAsync(string equipeId)
        {
            try
            {
                await AddAuthHeaderAsync();
                var response = await _httpClient.GetAsync($"/api/equipes/{equipeId}");

                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Erro ao obter equipe: {errorMsg}", null);
                }

                var equipe = await response.Content.ReadFromJsonAsync<Equipe>();
                return (true, "Equipe obtida com sucesso!", equipe);
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}", null);
            }
        }

        public async Task<(bool success, string mensagem, Equipe equipe)> EditarEquipeAsync(string equipeId, string nome, string descricao = null, string vinculoEmpresarial = null)
        {
            try
            {
                await AddAuthHeaderAsync();
                var payload = new { nome, descricao, vinculoEmpresarial };
                var response = await _httpClient.PutAsJsonAsync($"/api/equipes/{equipeId}", payload);

                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Erro ao editar equipe: {errorMsg}", null);
                }

                var equipe = await response.Content.ReadFromJsonAsync<Equipe>();
                return (true, "Equipe editada com sucesso!", equipe);
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}", null);
            }
        }

        public async Task<(bool success, string mensagem)> ExcluirEquipeAsync(string equipeId)
        {
            try
            {
                await AddAuthHeaderAsync();
                var response = await _httpClient.DeleteAsync($"/api/equipes/{equipeId}");

                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Erro ao excluir equipe: {errorMsg}");
                }

                return (true, "Equipe excluída com sucesso!");
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}");
            }
        }
        public async Task<(bool success, string mensagem, Equipe equipe)> ObterEquipePorCodigoAsync(string code)
        {
            try
            {
                await AddAuthHeaderAsync();
                var response = await _httpClient.GetAsync($"/api/equipes/by-code?code={Uri.EscapeDataString(code ?? string.Empty)}");
                if (response.IsSuccessStatusCode)
                {
                    var equipe = await response.Content.ReadFromJsonAsync<Equipe>();
                    if (equipe == null)
                        return (false, "Código inválido", null);
                    return (true, "Equipe encontrada", equipe);
                }
                var listResponse = await _httpClient.GetAsync("/api/equipes");
                if (!listResponse.IsSuccessStatusCode)
                {
                    var err = await listResponse.Content.ReadAsStringAsync();
                    return (false, $"Erro ao buscar equipe: {err}", null);
                }
                var todas = await listResponse.Content.ReadFromJsonAsync<List<Equipe>>() ?? new List<Equipe>();
                var found = todas.Find(e => string.Equals(e.code, code, StringComparison.OrdinalIgnoreCase));
                return found != null ? (true, "Equipe encontrada", found) : (false, "Código inválido", null);
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}", null);
            }
        }

        public async Task<(bool success, string mensagem)> EntrarNaEquipeAsync(string equipeId)
        {
            try
            {
                await AddAuthHeaderAsync();
                var response = await _httpClient.PostAsync($"/api/equipes/{Uri.EscapeDataString(equipeId ?? string.Empty)}/join", null);
                if (response.IsSuccessStatusCode)
                {
                    return (true, "Você entrou na equipe com sucesso!");
                }
                var errorMsg = await response.Content.ReadAsStringAsync();
                return (false, $"Falha ao entrar na equipe: {errorMsg}");
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}");
            }
        }

        public class Equipe
        {
            public string _id { get; set; }
            public string nome { get; set; }
            public string descricao { get; set; }
            public string vinculoEmpresarial { get; set; }
            public string code { get; set; }
            public List<MembroEquipe> membros { get; set; }
        }

        public class MembroEquipe
        {
            public string user { get; set; }
            public string role { get; set; }
        }

        public class Projeto
        {
            public string _id { get; set; }
            public string nome { get; set; }
            public string descricao { get; set; }
            public Equipe equipe { get; set; }
        }

        // Resposta de criação pode retornar apenas o id em 'equipe'
        private class ProjetoCriacaoResponse
        {
            public string _id { get; set; }
            public string nome { get; set; }
            public string descricao { get; set; }
            public string equipe { get; set; } // id da equipe
        }

        // Usuário atual (dados básicos)
        public async Task<(bool success, string mensagem, UserBasic user)> GetMeAsync()
        {
            try
            {
                await AddAuthHeaderAsync();
                var response = await _httpClient.GetAsync("/api/auth/me");

                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Erro ao obter usuário: {errorMsg}", null);
                }

                var me = await response.Content.ReadFromJsonAsync<UserBasic>();
                return (true, "Usuário obtido com sucesso!", me);
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}", null);
            }
        }

        public class UserBasic
        {
            public string id { get; set; }
            public string nome { get; set; }
            public string email { get; set; }
        }

        // Alterar senha
        public async Task<(bool success, string mensagem)> ChangePasswordAsync(string novaSenha, string confirmarSenha)
        {
            try
            {
                await AddAuthHeaderAsync();
                var payload = new { novaSenha, confirmarSenha };
                var response = await _httpClient.PostAsJsonAsync("/api/auth/change-password", payload);

                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Erro ao alterar senha: {errorMsg}");
                }

                return (true, "Senha alterada com sucesso!");
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}");
            }
        }

        // Projetos
        public async Task<(bool success, string mensagem, List<Projeto> projetos)> ListarProjetosAsync(string equipeId)
        {
            try
            {
                await AddAuthHeaderAsync();
                var response = await _httpClient.GetAsync($"/api/projetos?equipe={Uri.EscapeDataString(equipeId ?? string.Empty)}");
                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Erro ao listar projetos: {errorMsg}", null);
                }
                var projetos = await response.Content.ReadFromJsonAsync<List<Projeto>>();
                return (true, "Projetos listados com sucesso!", projetos);
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}", null);
            }
        }

        public async Task<(bool success, string mensagem, Projeto projeto)> CriarProjetoAsync(string nome, string descricao, string equipeId)
        {
            try
            {
                await AddAuthHeaderAsync();
                var payload = new { nome, descricao, equipe = equipeId };
                var response = await _httpClient.PostAsJsonAsync("/api/projetos", payload);

                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Erro ao criar projeto: {errorMsg}", null);
                }

                var projetoResp = await response.Content.ReadFromJsonAsync<ProjetoCriacaoResponse>();
                var projeto = new Projeto
                {
                    _id = projetoResp?._id,
                    nome = projetoResp?.nome,
                    descricao = projetoResp?.descricao,
                    equipe = string.IsNullOrWhiteSpace(projetoResp?.equipe) ? null : new Equipe { _id = projetoResp.equipe }
                };
                return (true, "Projeto criado com sucesso!", projeto);
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}", null);
            }
        }

        public async Task<(bool success, string mensagem, Projeto projeto)> EditarProjetoAsync(string projetoId, string nome, string descricao, string equipeId)
        {
            try
            {
                await AddAuthHeaderAsync();
                var payload = new { nome, descricao, equipe = equipeId };
                var response = await _httpClient.PutAsJsonAsync($"/api/projetos/{Uri.EscapeDataString(projetoId ?? string.Empty)}", payload);

                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Erro ao editar projeto: {errorMsg}", null);
                }

                var projetoAtualizado = await response.Content.ReadFromJsonAsync<Projeto>();
                return (true, "Projeto atualizado com sucesso!", projetoAtualizado);
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}", null);
            }
        }

        public async Task<(bool success, string mensagem)> ExcluirProjetoAsync(string projetoId)
        {
            try
            {
                await AddAuthHeaderAsync();
                var response = await _httpClient.DeleteAsync($"/api/projetos/{Uri.EscapeDataString(projetoId ?? string.Empty)}");
                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Erro ao excluir projeto: {errorMsg}");
                }
                return (true, "Projeto excluído com sucesso!");
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}");
            }
        }

        // ===== Tarefas =====
        public class TarefaDto
        {
            public string _id { get; set; }
            public string nome { get; set; }
            public string descricao { get; set; }
            public DateTime prazo { get; set; }
            public string dificuldade { get; set; }
            public string prioridade { get; set; }
            public string associado { get; set; }
            public string status { get; set; }
            public string projeto { get; set; }
            public bool visivelAtodos { get; set; }
        }

        public async Task<List<TarefaDto>> ListarTarefasPublicasAsync()
        {
            await AddAuthHeaderAsync();
            var response = await _httpClient.GetAsync("/api/tarefas");
            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = await response.Content.ReadAsStringAsync();
                throw new Exception($"Erro ao listar tarefas: {errorMsg}");
            }
            var tarefas = await response.Content.ReadFromJsonAsync<List<TarefaDto>>();
            return tarefas ?? new List<TarefaDto>();
        }

        public async Task<(bool success, string mensagem, TarefaDto tarefa)> AssociarTarefaAsync(string tarefaId)
        {
            try
            {
                await AddAuthHeaderAsync();
                var response = await _httpClient.PostAsync($"/api/tarefas/{Uri.EscapeDataString(tarefaId ?? string.Empty)}/associar", null);
                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Falha ao associar tarefa: {errorMsg}", null);
                }
                var payload = await response.Content.ReadFromJsonAsync<ActionTarefaResponse>();
                var tarefa = payload?.tarefa;
                return (true, "Tarefa associada com sucesso", tarefa);
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}", null);
            }
        }

        public async Task<(bool success, string mensagem, TarefaDto tarefa)> ConcluirTarefaAsync(string tarefaId)
        {
            try
            {
                await AddAuthHeaderAsync();
                var response = await _httpClient.PostAsync($"/api/tarefas/{Uri.EscapeDataString(tarefaId ?? string.Empty)}/concluir", null);
                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Falha ao concluir tarefa: {errorMsg}", null);
                }
                var payload = await response.Content.ReadFromJsonAsync<ActionTarefaResponse>();
                var tarefa = payload?.tarefa;
                return (true, "Tarefa concluída com sucesso", tarefa);
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}", null);
            }
        }

        private class ActionTarefaResponse
        {
            public string message { get; set; }
            public TarefaDto tarefa { get; set; }
        }

        public async Task<(bool success, string mensagem, TarefaDto tarefa)> CriarTarefaAsync(
            string nome,
            string descricao,
            DateTime prazo,
            string projetoId,
            string dificuldade = null,
            string prioridade = null,
            string status = null,
            bool? visivelAtodos = null)
        {
            try
            {
                await AddAuthHeaderAsync();
                var payload = new {
                    nome,
                    descricao,
                    prazo,
                    projeto = projetoId,
                    dificuldade,
                    prioridade,
                    status,
                    visivelAtodos
                };
                var response = await _httpClient.PostAsJsonAsync("/api/tarefas", payload);
                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Erro ao criar tarefa: {errorMsg}", null);
                }
                var tarefa = await response.Content.ReadFromJsonAsync<TarefaDto>();
                return (true, "Tarefa criada com sucesso!", tarefa);
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}", null);
            }
        }

        // ===== Membros (nome) =====
        public class MembroNomeDto
        {
            public string nome { get; set; }
            public string email { get; set; }
        }

        public async Task<List<MembroNomeDto>> ObterMembrosEquipeAsync(string equipeId)
        {
            await AddAuthHeaderAsync();
            var response = await _httpClient.GetAsync($"/api/equipes/{Uri.EscapeDataString(equipeId ?? string.Empty)}/membros");
            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = await response.Content.ReadAsStringAsync();
                throw new Exception($"Erro ao obter membros da equipe: {errorMsg}");
            }
            var membros = await response.Content.ReadFromJsonAsync<List<MembroNomeDto>>();
            return membros ?? new List<MembroNomeDto>();
        }
    }
}
