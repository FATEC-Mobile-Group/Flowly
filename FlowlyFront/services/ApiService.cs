using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

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

        public async Task<(bool success, string mensagem, string token, string nome)>
            LoginAsync(string email, string senha)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("/api/auth/login", new { email, senha });

                if (!response.IsSuccessStatusCode)
                {
                    var errorMsg = await response.Content.ReadAsStringAsync();
                    return (false, $"Erro ao fazer login: {errorMsg}", null, null);
                }

                var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
                return (true, "Login realizado com sucesso!", result.token, result.user.nome);
            }
            catch (Exception ex)
            {
                return (false, $"Erro de conexão: {ex.Message}", null, null);
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
    }
}
