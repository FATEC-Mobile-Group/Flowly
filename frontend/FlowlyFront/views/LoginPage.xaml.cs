using FlowlyFront.services;

namespace FlowlyFront.views;

public partial class LoginPage : ContentPage
{
    private readonly ApiService _apiService = new ApiService();

    public LoginPage()
    {
        InitializeComponent();
        LoginButton.Clicked += OnLoginClicked;
        CreateAccountButton.Clicked += async (s, e) => await Shell.Current.GoToAsync(nameof(RegisterPage));
    }

    private async void OnLoginClicked(object sender, EventArgs e)
    {
        string email = EmailEntry.Text?.Trim();
        string senha = PasswordEntry.Text?.Trim();

        MessageLabel.IsVisible = false;

        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(senha))
        {
            ShowMessage("Preencha todos os campos.", isError: true);
            return;
        }

        var (success, mensagem, token, nome) = await _apiService.LoginAsync(email, senha);

        if (success)
        {
            try
            {
                await SecureStorage.SetAsync("jwt_token", token);
                if (!string.IsNullOrWhiteSpace(nome))
                    await SecureStorage.SetAsync("user_name", nome);
                if (!string.IsNullOrWhiteSpace(email))
                    await SecureStorage.SetAsync("user_email", email);
            }
            catch { /* fallback silencioso */ }

            ShowMessage($"Bem-vindo {nome}!", isError: false);
            await Task.Delay(1000);
            await Shell.Current.GoToAsync(nameof(EquipesPage));
        }
        else
        {
            ShowMessage(mensagem, isError: true);
        }
    }

    private void ShowMessage(string message, bool isError)
    {
        MessageLabel.Text = message;
        MessageLabel.TextColor = isError ? Colors.Red : Colors.Green;
        MessageLabel.IsVisible = true;
    }
}
