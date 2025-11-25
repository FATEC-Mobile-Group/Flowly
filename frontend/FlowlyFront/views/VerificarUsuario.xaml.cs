using FlowlyFront.services;

namespace FlowlyFront.views;

public partial class VerificarUsuario : ContentPage
{
    private readonly ApiService _apiService = new ApiService();
    public VerificarUsuario()
	{
		InitializeComponent();

	}

    private async void OnVerificarClicked(object sender, EventArgs e)
    {
        string codigo = VeifyEntry.Text?.Trim();

        MessageLabel.IsVisible = false;

        if (string.IsNullOrEmpty(codigo))
        {
            ShowMessage("Código inválido.", isError: true);
            return;
        }

        var (success, mensagem) = await _apiService.VerificarCodigo(codigo);

        if (success)
        {
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