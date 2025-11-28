using FlowlyFront.services;

namespace FlowlyFront.views;

public partial class RegisterPage : ContentPage
{
    private readonly ApiService _apiService = new ApiService();

    public RegisterPage()
    {
        InitializeComponent();
        RegisterButton.Clicked += OnRegisterClicked;
        BackToLoginButton.Clicked += async (s, e) => await Shell.Current.GoToAsync(nameof(LoginPage));
    }

    private async void OnRegisterClicked(object sender, EventArgs e)
    {
        string nome = NameEntry.Text?.Trim();
        string email = EmailEntry.Text?.Trim();
        string senha = PasswordEntry.Text?.Trim();

        MessageLabel.IsVisible = false;

        if (string.IsNullOrEmpty(nome) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(senha))
        {
            ShowMessage("Preencha todos os campos.", isError: true);
            return;
        }

        var (success, mensagem) = await _apiService.RegisterAsync(nome, email, senha);

        if (success)
        {
            ShowMessage(mensagem, isError: false);
            await Task.Delay(1000);
            try
            {
                if (!string.IsNullOrWhiteSpace(email))
                    await SecureStorage.SetAsync("user_email", email);
            }
            catch { }
            await Shell.Current.GoToAsync(nameof(VerificarUsuario));
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

    private void OnTogglePasswordClicked(object sender, EventArgs e)
    {
        PasswordEntry.IsPassword = !PasswordEntry.IsPassword;
       
        TogglePasswordButton.ImageSource = PasswordEntry.IsPassword ? "eye.png" : "eyeoff.png";
    }
}
