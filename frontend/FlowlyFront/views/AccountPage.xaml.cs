using Microsoft.Maui.Controls;
using Microsoft.Maui.Storage;
using System;
using FlowlyFront.services;

namespace FlowlyFront.views
{
    public partial class AccountPage : ContentPage
    {
        private readonly ApiService _api = new ApiService();
        public AccountPage()
        {
            InitializeComponent();
        }

        protected async override void OnAppearing()
        {
            base.OnAppearing();
            // Tenta buscar do backend; fallback para dados locais
            var (ok, _, me) = await _api.GetMeAsync();
            string nome = null;
            string email = null;

            if (ok && me != null)
            {
                nome = me.nome;
                email = me.email;
                try
                {
                    if (!string.IsNullOrWhiteSpace(nome)) await SecureStorage.SetAsync("user_name", nome);
                    if (!string.IsNullOrWhiteSpace(email)) await SecureStorage.SetAsync("user_email", email);
                }
                catch { }
            }
            else
            {
                nome = await SecureStorage.GetAsync("user_name");
                email = await SecureStorage.GetAsync("user_email");
            }

            if (string.IsNullOrWhiteSpace(nome)) nome = "Usuário";
            GreetingLabel.Text = $"Olá, {nome}!";
        }

        private async void OnBackClicked(object sender, EventArgs e)
        {
            await Shell.Current.GoToAsync("..");
        }

        private async void OnMeusDadosTapped(object sender, EventArgs e)
        {
            await Shell.Current.GoToAsync(nameof(MeusDadosPage));
        }

        // Sem configurações: removido conforme solicitação

        private async void OnLogoutClicked(object sender, EventArgs e)
        {
            SecureStorage.Remove("jwt_token");
            SecureStorage.Remove("user_name");
            SecureStorage.Remove("user_email");
            // Navigate to login page (clear stack)
            await Shell.Current.GoToAsync(nameof(LoginPage));
        }
    }
}
