from pathlib import Path, PureWindowsPath

# I've explicitly declared my path as being in Windows format, so I can use forward slashes in it.
account_login = PureWindowsPath("account\\login.html")
# Convert path to the right format for the current operating system
TPATH_ACCOUNT_LOGIN= Path(account_login)
# print (TPATH_ACCOUNT_LOGIN)
account_register = PureWindowsPath("account\\register.html")
TPATH_ACCOUNT_REGISTER = Path(account_register)

account_dashboard = PureWindowsPath("account\\dashboard.html")
TPATH_ACCOUNT_DASHBOARD = Path(account_dashboard)

account_forget_password = PureWindowsPath("account\\forget_password.html")
TPATH_ACCOUNT_FORGET_PASSWORD = Path(account_forget_password)
