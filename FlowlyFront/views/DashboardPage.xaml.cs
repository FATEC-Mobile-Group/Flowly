using Microsoft.Maui.Controls;
using Microsoft.Maui.Storage;

namespace FlowlyFront.views;

public partial class DashboardPage : ContentPage
{
    public DashboardPage()
    {
        InitializeComponent();
        LogoutButton.Clicked += OnLogoutClicked;
    }

    private async void OnLogoutClicked(object sender, EventArgs e)
    {
        SecureStorage.Remove("jwt_token");
        await Shell.Current.GoToAsync(nameof(LoginPage));

    }
}
