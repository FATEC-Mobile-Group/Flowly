using Microsoft.Maui.Controls;
using Microsoft.Maui.Storage;
using FlowlyFront.services;

namespace FlowlyFront.views
{
    public partial class MeusDadosPage : ContentPage
    {
        private readonly ApiService _api = new ApiService();
        public MeusDadosPage()
        {
            InitializeComponent();
        }

        protected async override void OnAppearing()
        {
            base.OnAppearing();
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
            if (string.IsNullOrWhiteSpace(email)) email = "(não disponível)";

            NomeLabel.Text = $"Nome: {nome}";
            EmailLabel.Text = $"Email: {email}";
        }

        private async void OnCloseClicked(object sender, System.EventArgs e)
        {
            await Shell.Current.GoToAsync("..");
        }

        private async void OnChangePasswordClicked(object sender, System.EventArgs e)
        {
            var nova = NovaSenhaEntry?.Text?.Trim();
            var confirmar = ConfirmarSenhaEntry?.Text?.Trim();
            ChangePasswordMessage.IsVisible = false;

            if (string.IsNullOrEmpty(nova) || string.IsNullOrEmpty(confirmar))
            {
                await DisplayAlert("Alterar senha", "Preencha os dois campos de senha.", "OK");
                return;
            }
            if (nova != confirmar)
            {
                ChangePasswordMessage.Text = "As senhas não coincidem.";
                ChangePasswordMessage.TextColor = Color.FromArgb("#E04B4B");
                ChangePasswordMessage.IsVisible = true;
                return;
            }

            var (ok, msg) = await _api.ChangePasswordAsync(nova, confirmar);
            if (ok)
            {
                NovaSenhaEntry.Text = string.Empty;
                ConfirmarSenhaEntry.Text = string.Empty;
                ChangePasswordMessage.Text = "Senha alterada com sucesso!";
                ChangePasswordMessage.TextColor = Color.FromArgb("#2E7D32");
                ChangePasswordMessage.IsVisible = true;
            }
            else
            {
                // Mantém alert para erros, conforme solicitado somente alterar sucesso
                await DisplayAlert("Erro", msg ?? "Não foi possível alterar a senha.", "OK");
            }
        }
    }
}