using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.Maui.Storage;

namespace FlowlyFront.Services
{
    public static class AuthService
    {
        private static readonly HttpClient client = new HttpClient
        {
            BaseAddress = new Uri("https://flowlyapp.azurewebsites.net")
        };

        public static async Task<bool> LoginAsync(string email, string senha)
        {
            var response = await client.PostAsJsonAsync("/api/auth/login", new { email, senha });
            if (!response.IsSuccessStatusCode) return false;

            var data = await response.Content.ReadFromJsonAsync<LoginResponse>();
            await SecureStorage.SetAsync("jwt_token", data.token);
            return true;
        }

        public static async Task<bool> RegistrarAsync(string nome, string email, string senha)
        {
            var response = await client.PostAsJsonAsync("/api/auth/registrar", new { nome, email, senha });
            return response.IsSuccessStatusCode;
        }

        private class LoginResponse
        {
            public string token { get; set; }
        }
    }
}
