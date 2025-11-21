using Microsoft.Maui.Controls;

namespace FlowlyFront.views;

public partial class EquipesPage : ContentPage
{
    public EquipesPage()
    {
        InitializeComponent();
    }

    private async void OnMinhasEquipesClicked(object sender, TappedEventArgs e)
    {
        await Shell.Current.GoToAsync(nameof(MinhasEquipesPage));
    }

    private async void OnCriarEquipeClicked(object sender, TappedEventArgs e)
    {
        await Shell.Current.GoToAsync(nameof(CriarEquipePage));
    }

    private async void OnEntrarComCodigoClicked(object sender, TappedEventArgs e)
    {
        var code = await DisplayPromptAsync("Entrar em uma equipe", "Digite o código da equipe (4 dígitos)", "Buscar", "Cancelar", keyboard: Keyboard.Numeric, maxLength: 4);
        if (string.IsNullOrWhiteSpace(code))
            return;
        code = code.Trim();
        if (code.Length != 4 || !int.TryParse(code, out _))
        {
            await DisplayAlert("Código inválido", "O código deve ter 4 números.", "OK");
            return;
        }

        var api = new FlowlyFront.services.ApiService();
        var (ok, msg, equipe) = await api.ObterEquipePorCodigoAsync(code);
        if (!ok || equipe == null)
        {
            await DisplayAlert("Código inválido", "Nenhuma equipe encontrada para este código.", "OK");
            return;
        }

        var confirmar = await DisplayAlert("Confirmar entrada", $"Entrar na equipe '{equipe.nome}'?", "Entrar", "Cancelar");
        if (!confirmar) return;

        var (joined, joinMsg) = await api.EntrarNaEquipeAsync(equipe._id);
        if (joined)
        {
            await DisplayAlert("Sucesso", "Você entrou na equipe!", "OK");
            var url = $"{nameof(ProjetosPage)}?EquipeId={Uri.EscapeDataString(equipe._id ?? string.Empty)}&EquipeNome={Uri.EscapeDataString(equipe.nome ?? string.Empty)}";
            await Shell.Current.GoToAsync(url);
        }
        else
        {
            await DisplayAlert("Falha", string.IsNullOrWhiteSpace(joinMsg) ? "Não foi possível entrar na equipe." : joinMsg, "OK");
        }
    }
}

