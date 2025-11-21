namespace FlowlyFront.views;

public partial class WelcomePage : ContentPage
{
	public WelcomePage()
	{
        InitializeComponent();

        CreateAccountButton.Clicked += async (s, e) =>
        {
            await Shell.Current.GoToAsync(nameof(RegisterPage));
        };

        LoginButton.Clicked += async (s, e) =>
        {
            await Shell.Current.GoToAsync(nameof(LoginPage));
        };
    }
}