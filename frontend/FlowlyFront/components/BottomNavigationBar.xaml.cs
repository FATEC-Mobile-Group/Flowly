using Microsoft.Maui.Controls;
using FlowlyFront.views;

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
        // TODO: Navegar para a tela de busca
        await Shell.Current.DisplayAlert("Busca", "Funcionalidade em desenvolvimento", "OK");
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

