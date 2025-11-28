using FlowlyFront.services;

namespace FlowlyFront.views;

public partial class LoginPage : ContentPage
{
    private readonly ApiService _apiService = new ApiService();

    public LoginPage()
    {
        InitializeComponent();
        LoginButton.Clicked += OnLoginClicked;
        CreateAccountButton.Clicked += OnCreateAccountClicked;
    }

    private void OnTogglePasswordClicked(object sender, EventArgs e)
    {
        PasswordEntry.IsPassword = !PasswordEntry.IsPassword;
        // Alternar entre ícone de olho (senha oculta = mostrar, senha visível = ocultar)
        // Quando IsPassword é true, mostramos "👁" (mostrar senha)
        // Quando IsPassword é false, mostramos "👁️" (ocultar senha)
        TogglePasswordButton.Text = PasswordEntry.IsPassword ? "👁" : "👁️";
    }

    private async void OnCreateAccountClicked(object sender, EventArgs e)
    {
        // Animação de escala ao clicar
        await CreateAccountButton.ScaleTo(0.95, 50, Easing.SinOut);
        await CreateAccountButton.ScaleTo(1.0, 50, Easing.SinIn);
        
        await Shell.Current.GoToAsync(nameof(RegisterPage));
    }

    private async void OnLoginClicked(object sender, EventArgs e)
    {
        // Animação de escala ao clicar
        await LoginButton.ScaleTo(0.95, 50, Easing.SinOut);
        await LoginButton.ScaleTo(1.0, 50, Easing.SinIn);
        
        string email = EmailEntry.Text?.Trim();
        string senha = PasswordEntry.Text?.Trim();

        MessageFrame.IsVisible = false;

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
            if (!string.IsNullOrWhiteSpace(mensagem) && mensagem.Contains("Email não verificado"))
            {
                await Task.Delay(500);
                await Shell.Current.GoToAsync(nameof(VerificarUsuario));
            }
        }
    }

    private void ShowMessage(string message, bool isError)
    {
        MessageLabel.Text = message;
        MessageFrame.IsVisible = true;
        
        if (isError)
        {
            MessageFrame.BackgroundColor = Color.FromArgb("#FEE2E2");
            MessageFrame.BorderColor = Color.FromArgb("#FCA5A5");
            MessageLabel.TextColor = Color.FromArgb("#DC2626");
        }
        else
        {
            MessageFrame.BackgroundColor = Color.FromArgb("#D1FAE5");
            MessageFrame.BorderColor = Color.FromArgb("#86EFAC");
            MessageLabel.TextColor = Color.FromArgb("#059669");
        }
    }
}
