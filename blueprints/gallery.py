
# Import and setup this blueprint.
from sanic import Blueprint, response

bp_gallery = Blueprint("gallery")


@bp_gallery.route("/gallery", methods=["GET"])
async def page_gallery(request):
    # Set the default state of partial requests to false.
    partial = False

    # Check if the partial was specifically requested.
    if request.args.get("partial"):
        if request.args.get("partial") in ["True", "true", "1"]:
            partial = True

    template_env = request.app.config.template_env

    t = template_env.get_template("gallery.html.j2")

    rendered_template = await t.render_async(
        partial=partial
    )

    return response.html(rendered_template)
