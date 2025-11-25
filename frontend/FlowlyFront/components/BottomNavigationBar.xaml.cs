using Microsoft.Maui.Controls;
using FlowlyFront.views;
using FlowlyFront.services;

namespace FlowlyFront.components;

public partial class BottomNavigationBar : Border
{
    public BottomNavigationBar()
    {
        InitializeComponent();
    }

    private async void OnHomeClicked(object sender, EventArgs e)
    {
        await Shell.Current.GoToAsync(nameof(EquipesPage));
    }

    private async void OnSearchClicked(object sender, EventArgs e)
    {
        var code = await Shell.Current.DisplayPromptAsync("Entrar em uma equipe", "Digite o código da equipe (4 dígitos)", "Buscar", "Cancelar", keyboard: Keyboard.Numeric, maxLength: 4);
        if (string.IsNullOrWhiteSpace(code))
            return;
        code = code.Trim();
        if (code.Length != 4 || !int.TryParse(code, out _))
        {
            await Shell.Current.DisplayAlert("Código inválido", "O código deve ter 4 números.", "OK");
            return;
        }

        var api = new ApiService();
        var (ok, msg, equipe) = await api.ObterEquipePorCodigoAsync(code);
        if (!ok || equipe == null)
        {
            await Shell.Current.DisplayAlert("Código inválido", "Nenhuma equipe encontrada para este código.", "OK");
            return;
        }

        var confirmar = await Shell.Current.DisplayAlert("Confirmar entrada", $"Entrar na equipe '{equipe.nome}'?", "Entrar", "Cancelar");
        if (!confirmar) return;

        var (joined, joinMsg) = await api.EntrarNaEquipeAsync(equipe._id);
        if (joined)
        {
            await Shell.Current.DisplayAlert("Sucesso", "Você entrou na equipe!", "OK");
            var url = $"{nameof(ProjetosPage)}?EquipeId={Uri.EscapeDataString(equipe._id ?? string.Empty)}&EquipeNome={Uri.EscapeDataString(equipe.nome ?? string.Empty)}";
            await Shell.Current.GoToAsync(url);
        }
        else
        {
            await Shell.Current.DisplayAlert("Falha", string.IsNullOrWhiteSpace(joinMsg) ? "Não foi possível entrar na equipe." : joinMsg, "OK");
        }
    }

    private async void OnTeamsClicked(object sender, EventArgs e)
    {
        await Shell.Current.GoToAsync(nameof(MinhasEquipesPage));
    }

    private async void OnProfileClicked(object sender, EventArgs e)
    {
        await Shell.Current.GoToAsync(nameof(AccountPage));
    }
}

