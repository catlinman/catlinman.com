
# Configure the module to make importing of blueprints with the syntax of
# 'import blueprints -> blueprints.content' possible.
from .root import bp_root as root
from .about import bp_about as about
from .blog import bp_blog as blog
from .contact import bp_contact as contact
from .error import bp_error as error
from .gallery import bp_gallery as gallery
from .location import bp_location as location
from .middleware import bp_middleware as middleware
from .project import bp_project as project
from .psa import bp_psa as psa
from .template import bp_template as template
from .user import bp_user as user

__all__ = [
    "about",
    "blog",
    "contact",
    "error",
    "gallery",
    "location",
    "middleware",
    "project",
    "psa",
    "template",
    "user"
]
